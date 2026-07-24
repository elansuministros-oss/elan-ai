import {
  resolveControlledConnectReadAction
} from '../actions/index.js';
import {
  buildControlledConnectReadResponse
} from '../responses/index.js';

function normalizeCommand(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[.!?]+$/g, '');
}

function isCancellationCommand(message) {
  const normalized = normalizeCommand(message);

  const exactCommands = new Set([
    'cancelar',
    'cancela',
    'cancelalo',
    'cancelala',
    'cancelar orden',
    'cancelar esta orden',
    'elimina esa orden',
    'eliminar esa orden',
    'detener',
    'deten',
    'detener proceso',
    'detener este proceso',
    'para',
    'parar',
    'olvida eso',
    'olvidalo',
    'deja eso',
    'dejalo',
    'cambiar de tema',
    'cambiemos de tema',
    'cancelar esta conversacion',
    'da por cancelar esta conversacion',
    'no voy a agregar ningun proveedor',
    'no quiero agregar ningun proveedor'
  ]);

  if (exactCommands.has(normalized)) {
    return true;
  }

  return /^(cancelar|cancela|deten|detener|parar|olvida|deja)\b/.test(normalized);
}

function createCancellationPlan(context) {
  return Object.freeze({
    planId: `plan-${context.requestId}`,
    requestId: context.requestId,
    channel: context.channel ?? null,
    intent: 'cancel',
    selectedOperator: null,
    classificationSource: 'PRIORITY_COMMAND',
    steps: Object.freeze([
      'CLEAR_ACTIVE_FLOW',
      'BUILD_RESPONSE',
      'SAVE_MEMORY'
    ]),
    status: 'CANCELLED',
    createdAt: new Date().toISOString()
  });
}

export class ElanAIRuntime {
  constructor({
    channelEngine,
    dispatcher,
    identityEngine,
    planner,
    memoryEngine,
    stateEngine,
    knowledgeEngine,
    reasoningEngine,
    operatorRegistry,
    toolEngine,
    businessEngine
  }) {
    const dependencies = {
      channelEngine,
      dispatcher,
      identityEngine,
      planner,
      memoryEngine,
      stateEngine,
      knowledgeEngine,
      reasoningEngine,
      operatorRegistry,
      toolEngine,
      businessEngine
    };

    for (const [name, dependency] of Object.entries(dependencies)) {
      if (!dependency) {
        throw new TypeError(`ElanAIRuntime requiere ${name}`);
      }
    }

    this.channelEngine = channelEngine;
    this.dispatcher = dispatcher;
    this.identityEngine = identityEngine;
    this.planner = planner;
    this.memoryEngine = memoryEngine;
    this.stateEngine = stateEngine;
    this.knowledgeEngine = knowledgeEngine;
    this.reasoningEngine = reasoningEngine;
    this.operatorRegistry = operatorRegistry;
    this.toolEngine = toolEngine;
    this.businessEngine = businessEngine;
  }

  async process(channelName, rawInput = {}, options = {}) {
    const executeTools = options.executeTools !== false;
    const normalized = this.channelEngine.normalize(channelName, rawInput);
    const context = this.dispatcher.dispatch(normalized);

    const identityResult = await this.identityEngine.resolve({
      channel: context.channel,
      externalUserId: context.externalUserId || context.requestId,
      phone: normalized.metadata?.phone ?? rawInput.phone ?? null,
      email: normalized.metadata?.email ?? rawInput.email ?? null,
      displayName:
        normalized.metadata?.displayName ??
        rawInput.displayName ??
        rawInput.name ??
        null,
      metadata: {
        sourceChannel: context.channel
      }
    });

    const identity = identityResult.identity;
    const sessionId = identity.identityId;
    const stateKey = `identity:${identity.identityId}`;

    const currentState = await this.stateEngine.get(stateKey);

    if (!currentState) {
      await this.stateEngine.set(stateKey, {
        phase: 'RECEIVED',
        identityId: identity.identityId,
        channel: context.channel,
        externalUserId: context.externalUserId,
        activeIntent: null,
        activeOperator: null,
        pendingWorkflow: null,
        pendingFields: [],
        activeForm: null,
        lastRequestId: context.requestId
      });
    } else {
      await this.stateEngine.patch(stateKey, {
        phase: 'RECEIVED',
        channel: context.channel,
        externalUserId: context.externalUserId,
        lastRequestId: context.requestId
      });
    }

    await this.memoryEngine.appendMessage(
      sessionId,
      'user',
      context.message
    );

    if (isCancellationCommand(context.message)) {
      const plan = createCancellationPlan(context);
      const cancellationMessage = 'Entendido. Cancelé el proceso activo. Decime qué necesitás ahora.';

      await this.stateEngine.patch(stateKey, {
        phase: 'CANCELLED',
        activeIntent: null,
        activeOperator: null,
        pendingWorkflow: null,
        pendingFields: [],
        activeForm: null,
        cancelledAt: new Date().toISOString(),
        lastRequestId: context.requestId
      });

      const formatted = this.channelEngine.formatResponse(
        channelName,
        {
          externalUserId: context.externalUserId,
          response: cancellationMessage,
          metadata: {
            requestId: context.requestId,
            identityId: identity.identityId,
            operator: null,
            cancelled: true
          }
        }
      );

      await this.memoryEngine.appendMessage(
        sessionId,
        'assistant',
        formatted.message
      );

      return Object.freeze({
        requestId: context.requestId,
        identity,
        identityCreated: identityResult.created,
        identityMerged: identityResult.merged ?? false,
        sessionId,
        stateKey,
        status: 'COMPLETED',
        cancelled: true,
        context,
        plan,
        memory: await this.memoryEngine.getSession(sessionId),
        state: await this.stateEngine.get(stateKey),
        knowledge: Object.freeze([]),
        reasoning: null,
        operator: null,
        tools: Object.freeze([]),
        business: Object.freeze({
          allowed: true,
          status: 'APPROVED',
          reason: 'PRIORITY_CANCELLATION_COMMAND'
        }),
        response: formatted
      });
    }

    const plan = this.planner.createPlan(context);

    await this.stateEngine.patch(stateKey, {
      phase: 'PLANNED',
      activeIntent: plan.intent,
      activeOperator: plan.selectedOperator,
      lastRequestId: context.requestId
    });

    const memory = await this.memoryEngine.getSession(sessionId);
    const state = await this.stateEngine.get(stateKey);
    const knowledge = await this.knowledgeEngine.search(context.message);

    const reasoning = await this.reasoningEngine.reason({
      context,
      plan,
      memory,
      state,
      identity,
      knowledge
    });

    await this.stateEngine.patch(stateKey, {
      phase: 'REASONED'
    });

    const operatorResult = await this.operatorRegistry.execute(
      plan.selectedOperator,
      {
        context,
        plan,
        identity,
        memory,
        state: await this.stateEngine.get(stateKey),
        knowledge,
        reasoning
      }
    );

    await this.stateEngine.patch(stateKey, {
      phase: 'OPERATED'
    });

    const controlledConnectAction =
      resolveControlledConnectReadAction(context);
    const actions = [
      ...(operatorResult.actions || []),
      ...(controlledConnectAction ? [controlledConnectAction] : [])
    ];
    const executableActions = executeTools
      ? actions
        .filter((action) => typeof action.toolName === 'string')
      : [];

    const toolResults = [];

    for (const action of executableActions) {
      const toolResult = await this.toolEngine.run({
        toolName: action.toolName,
        requestId: context.requestId,
        input: action.input || {}
      });

      toolResults.push(toolResult);
    }

    const business = this.businessEngine.evaluate({
      requestId: context.requestId,
      operator: plan.selectedOperator,
      context,
      identity,
      plan,
      memory,
      state: await this.stateEngine.get(stateKey),
      reasoning,
      operatorResult,
      toolResults
    });

    if (!business.allowed) {
      await this.stateEngine.patch(stateKey, {
        phase: 'REJECTED'
      });

      return Object.freeze({
        requestId: context.requestId,
        identity,
        identityCreated: identityResult.created,
        identityMerged: identityResult.merged ?? false,
        sessionId,
        stateKey,
        status: 'REJECTED',
        context,
        plan,
        memory: await this.memoryEngine.getSession(sessionId),
        state: await this.stateEngine.get(stateKey),
        knowledge,
        reasoning,
        operator: operatorResult,
        tools: Object.freeze(toolResults),
        business,
        response: null
      });
    }

    const controlledReadResponse =
      buildControlledConnectReadResponse(toolResults);
    const formatted = this.channelEngine.formatResponse(
      channelName,
      {
        externalUserId: context.externalUserId,
        response: controlledReadResponse || operatorResult.response,
        metadata: {
          requestId: context.requestId,
          identityId: identity.identityId,
          operator: plan.selectedOperator,
          controlledRead: Boolean(controlledReadResponse)
        }
      }
    );

    await this.memoryEngine.appendMessage(
      sessionId,
      'assistant',
      formatted.message
    );

    await this.stateEngine.patch(stateKey, {
      phase: 'COMPLETED'
    });

    return Object.freeze({
      requestId: context.requestId,
      identity,
      identityCreated: identityResult.created,
      identityMerged: identityResult.merged ?? false,
      sessionId,
      stateKey,
      status: 'COMPLETED',
      context,
      plan,
      memory: await this.memoryEngine.getSession(sessionId),
      state: await this.stateEngine.get(stateKey),
      knowledge,
      reasoning,
      operator: operatorResult,
      tools: Object.freeze(toolResults),
      business,
      response: formatted
    });
  }
}
