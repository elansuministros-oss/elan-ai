import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BusinessEngine,
  BusinessRule,
  BusinessRuleRegistry,
  createDefaultBusinessRuleRegistry
} from '../src/business/index.js';

test('BusinessEngine aprueba entrada valida', () => {
  const registry = createDefaultBusinessRuleRegistry();
  const engine = new BusinessEngine(registry);

  const result = engine.evaluate({
    requestId: 'req-001',
    operator: 'sales'
  });

  assert.equal(result.allowed, true);
  assert.equal(result.status, 'APPROVED');
  assert.deepEqual(result.blockedBy, []);
});

test('BusinessEngine rechaza entrada sin operador', () => {
  const registry = createDefaultBusinessRuleRegistry();
  const engine = new BusinessEngine(registry);

  const result = engine.evaluate({
    requestId: 'req-002'
  });

  assert.equal(result.allowed, false);
  assert.equal(result.status, 'REJECTED');
  assert.deepEqual(result.blockedBy, ['REQUIRE_OPERATOR']);
});

test('BusinessRuleRegistry rechaza duplicados', () => {
  const registry = new BusinessRuleRegistry();

  const rule = new BusinessRule({
    id: 'TEST',
    description: 'Regla de prueba',
    evaluate() {
      return { allowed: true };
    }
  });

  registry.register(rule);

  assert.throws(
    () => registry.register(rule),
    /duplicada/
  );
});

test('BusinessEngine rechaza resultados invalidos', () => {
  const registry = new BusinessRuleRegistry();

  registry.register(
    new BusinessRule({
      id: 'INVALID',
      description: 'Regla invalida',
      evaluate() {
        return {};
      }
    })
  );

  const engine = new BusinessEngine(registry);

  assert.throws(
    () => engine.evaluate({}),
    /Resultado invalido/
  );
});