const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const scriptContent = fs.readFileSync('script.js', 'utf8');

const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="terminal-body"></div></body></html>`, {
    runScripts: "dangerously",
    beforeParse(window) {
        // mock audio context
        window.AudioContext = class {
            constructor() { this.state = 'running'; }
            createOscillator() { return { frequency: { setValueAtTime: () => {} }, connect: () => {}, start: () => {}, stop: () => {} }; }
            createGain() { return { gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {} }; }
        };
        // mock window and audio
        window.AudioContextClass = window.AudioContext;
        
        // mock canvas
        window.HTMLCanvasElement.prototype.getContext = function () {
            return {
                fillRect: () => {},
                fillText: () => {},
                clearRect: () => {},
                getImageData: () => {},
                putImageData: () => {},
                createImageData: () => {},
                setTransform: () => {},
                drawImage: () => {},
                save: () => {},
                fillText: () => {},
                restore: () => {},
                beginPath: () => {},
                moveTo: () => {},
                lineTo: () => {},
                closePath: () => {},
                stroke: () => {},
                translate: () => {},
                scale: () => {},
                rotate: () => {},
                arc: () => {},
                fill: () => {},
                measureText: () => { return { width: 0 }; },
                transform: () => {},
                rect: () => {},
                clip: () => {},
            };
        };
    }
});

try {
    dom.window.eval(scriptContent);
    // trigger terminal
    dom.window.eval(`
        // fake call
        const ev = new dom.window.KeyboardEvent('keydown', { key: 'Enter' });
        // wait, terminalInput is not in DOM. Let's just call triggerMatrix directly.
        // wait, triggerMatrix is not global. It's inside DOMContentLoaded.
    `);
    
    // So let's extract triggerMatrix manually.
    const match = scriptContent.match(/function triggerMatrix\(\) \{([\s\S]*?)\}\n\s*\}\);/);
    if (match) {
        let code = 'function triggerMatrix() {' + match[1] + '}';
        // mock dependencies
        code = `
        let isMuted = false;
        let audioContext = new window.AudioContext();
        function playBeep() {}
        ` + code + `\ntriggerMatrix();`;
        
        dom.window.eval(code);
        console.log('triggerMatrix executed successfully without throwing');
    } else {
        console.log('triggerMatrix function not found');
    }
} catch (e) {
    console.error("Error executing script:", e);
}
