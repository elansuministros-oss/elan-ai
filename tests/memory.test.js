import assert from "node:assert/strict";
import test from "node:test";
import { MemoryEngine } from "../src/memory/index.js";

test("Memory crea y recupera sesion",()=>{
 const m=new MemoryEngine();
 m.appendMessage("S1","user","Hola");
 m.appendMessage("S1","assistant","Bienvenido");
 const s=m.getSession("S1");
 assert.equal(s.messages.length,2);
 assert.match(s.summary,/Hola/);
});