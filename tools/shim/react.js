export class Component { constructor(props){ this.props = props; this.state = {}; } setState(p){ Object.assign(this.state, typeof p === "function" ? p(this.state) : p); } }
export function createElement(type, props, ...children){ return { type, props: props || {}, children: children.flat(Infinity).filter(c => c != null && c !== false) }; }
export default { Component, createElement };
