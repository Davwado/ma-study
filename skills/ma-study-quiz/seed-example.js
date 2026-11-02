const SP = process.argv[2];
const {Q, LINKS} = require(SP + '/q.json');
const C = [
 [9,'rnn-basics','Vanilla RNN equations'],[9,'rnn-tasks','Sequence task types'],[9,'bptt','BPTT and truncated BPTT'],
 [9,'vanishing','Vanishing / exploding gradients'],[9,'clipping','Gradient clipping'],[9,'lstm','LSTM cell and gates'],[9,'gated-variants','Gated RNN variants'],
 [8,'gan-objective','GAN objective and losses'],[8,'gan-training','GAN training stability'],[8,'cgan','Conditional GAN'],[8,'dcgan','DCGAN'],
 [7,'degradation','Depth degradation problem'],[7,'resblock','Residual and bottleneck blocks'],[7,'resnet-arch','ResNet stages and downsampling'],
 [7,'bn-mechanics','BatchNorm computation'],[7,'bn-why','Why BatchNorm helps'],[7,'norm-variants','Layer / Group / Instance norm'],
];
const TAGS = [['rnn-basics'],['rnn-tasks'],['bptt'],['vanishing'],['vanishing','clipping','lstm'],['lstm','vanishing'],['lstm'],['gated-variants','lstm'],
 ['gan-training','gan-objective'],['gan-objective'],['cgan'],['dcgan'],
 ['degradation'],['resblock'],['resnet-arch','resblock'],['bn-mechanics'],['bn-mechanics'],['bn-why'],['norm-variants']];
const cid = (w, s) => `ece4179-w${w}-${s}`;
const weekOf = s => C.find(c => c[1] === s)[0];
const seed = {concepts:{}, questions:{}, quizzes:{}, meta:{}};
C.forEach(([w,s,n],k) => seed.concepts[cid(w,s)] = {unit:'ECE4179', week:w, name:n, order:k});
const qids = Q.map((q,k) => {
  const w = weekOf(TAGS[k][0]);
  const id = `ece4179-w${w}-q${String(k+1).padStart(2,'0')}`;
  const o = {unit:'ECE4179', week:w, concepts: TAGS[k].map(s => cid(weekOf(s), s)), ...q, link: LINKS[k] || {}};
  seed.questions[id] = o; return id;
});
seed.quizzes['ece4179-w7-9'] = {unit:'ECE4179', title:'Weeks 7–9: ResNet, GANs, RNNs', created:'2026-10-30', qids};
seed.meta['ece4179'] = {unit:'ECE4179', name:'Neural Networks and Deep Learning', examDate:'2026-11-12T10:30:00+11:00'};
if (TAGS.length !== Q.length) throw 'tag count';
require('fs').writeFileSync(SP + '/seed.json', JSON.stringify(seed, null, 1));
console.log(Object.keys(seed.concepts).length, 'concepts', qids.length, 'questions', JSON.stringify(seed).length, 'bytes');
