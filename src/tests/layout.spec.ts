import {Graph} from 'graphlib';
import {runLayout} from './../layout';

xtest('Test layout cases', () => {
	const g = new Graph({multigraph: true});
	g.setNode('1', {layer: undefined, width: 30, height: 30});
	g.setNode('2', {layer: undefined, width: 30, height: 30});
	g.setNode('3', {layer: undefined, width: 30, height: 30});
	g.setNode('4', {layer: undefined, width: 30, height: 30});
	g.setEdge('1', '2', {reversed: false});
	g.setEdge('2', '3', {reversed: false});
	g.setEdge('4', '3', {reversed: false});
	g.setEdge('3', '1', {reversed: false});

	runLayout(g);
	// finish the test, inspect the output
	expect(true).toBe(true);
});
