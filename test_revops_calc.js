// Casi di test fatti a mano per revops_calc.js. Lancio: node test_revops_calc.js
const RC = require('./revops_calc.js');
let ok = 0, ko = 0;
function vicino(nome, a, b, tol = 0.01) { const p = Math.abs(a - b) <= tol; p ? ok++ : ko++; console.log((p ? 'OK ' : 'KO ') + nome + ': atteso ' + b + ', ottenuto ' + a); }
function vero(nome, c) { c ? ok++ : ko++; console.log((c ? 'OK ' : 'KO ') + nome); }

// T1 funnel: 300.000 € in 6 mesi, deal 15.000, win 25%, opp da meeting 50%, show 80%, meeting da contatto 10%, 2 venditori, ciclo 90 gg
let f = RC.funnel({ obiettivo: 300000, dealMedio: 15000, winRate: 25, oppDaMeeting: 50, showRate: 80, meetingDaContatto: 10, mesi: 6, venditori: 2, cicloGiorni: 90 });
vicino('T1 deal', f.deal, 20); vicino('T1 opportunità', f.opp, 80); vicino('T1 meeting tenuti', f.tenuti, 160);
vicino('T1 meeting fissati', f.fissati, 200); vicino('T1 contatti', f.contatti, 2000); vicino('T1 pipeline', f.pipeline, 1200000);
vicino('T1 fissati al mese', f.fissatiMese, 33.33); vicino('T1 fissati a settimana', f.fissatiSettimana, 7.69);
vicino('T1 tenuti al mese per venditore', f.tenutiMesePerVenditore, 13.33); vicino('T1 giorni utili', f.giorniUtili, 92.5);
vicino('T1 fissati a settimana nel tempo utile', f.fissatiSettimanaUtile, 15.14);
// T2 arrotondamento dei deal per eccesso
vicino('T2 deal 100.000 / 30.000', RC.funnel({ obiettivo: 100000, dealMedio: 30000, winRate: 20, oppDaMeeting: 50, showRate: 80, meetingDaContatto: 10, mesi: 3 }).deal, 4);
// T3 input non validi e ciclo più lungo del periodo
vero('T3 win rate 0 rifiutato', !RC.funnel({ obiettivo: 1, dealMedio: 1, winRate: 0, oppDaMeeting: 50, showRate: 80, meetingDaContatto: 10, mesi: 3 }).ok);
vero('T3 win rate 120 rifiutato', !RC.funnel({ obiettivo: 1, dealMedio: 1, winRate: 120, oppDaMeeting: 50, showRate: 80, meetingDaContatto: 10, mesi: 3 }).ok);
vero('T3 obiettivo vuoto rifiutato', !RC.funnel({ obiettivo: '', dealMedio: 1, winRate: 20, oppDaMeeting: 50, showRate: 80, meetingDaContatto: 10, mesi: 3 }).ok);
vero('T3 testo rifiutato', !RC.funnel({ obiettivo: 'abc', dealMedio: 1, winRate: 20, oppDaMeeting: 50, showRate: 80, meetingDaContatto: 10, mesi: 3 }).ok);
vero('T3 ciclo 200 gg su 6 mesi: pipeline già necessaria', RC.funnel({ obiettivo: 300000, dealMedio: 15000, winRate: 25, oppDaMeeting: 50, showRate: 80, meetingDaContatto: 10, mesi: 6, cicloGiorni: 200 }).pipelineGiaServe);

// T4 CAC: 10.000 €/mese di programmi per 12 mesi, persone 300.000 €/anno al 50%, provvigioni 30.000, 20 clienti (8 da paid), 2.000 €/mese per cliente, margine 75%, churn 2%
let c = RC.cac({ paidMese: 5000, strumentiMese: 1000, eventiMese: 2000, agenzieMese: 2000, costoPersoneAnno: 300000, quotaTempo: 50, provvigioni: 30000, mesi: 12, clientiNuovi: 20, clientiPaid: 8, ricavoMeseCliente: 2000, margine: 75, churnMese: 2, durataMesi: '' });
vicino('T4 costo totale', c.totale, 300000); vicino('T4 CAC blended', c.cacBlended, 15000); vicino('T4 CAC paid', c.cacPaid, 7500);
vicino('T4 payback mesi', c.payback, 10); vicino('T4 durata da churn', c.durata, 50); vicino('T4 LTV', c.ltv, 75000); vicino('T4 LTV:CAC', c.rapporto, 5);
// T5 senza churn né durata, poi con durata 36
vero('T5 manca churn e durata: errore', !RC.cac({ paidMese: 5000, strumentiMese: 0, eventiMese: 0, agenzieMese: 0, costoPersoneAnno: 0, quotaTempo: 0, provvigioni: 0, mesi: 12, clientiNuovi: 20, ricavoMeseCliente: 2000, margine: 75, churnMese: '', durataMesi: '' }).ok);
c = RC.cac({ paidMese: 5000, strumentiMese: 1000, eventiMese: 2000, agenzieMese: 2000, costoPersoneAnno: 300000, quotaTempo: 50, provvigioni: 30000, mesi: 12, clientiNuovi: 20, clientiPaid: '', ricavoMeseCliente: 2000, margine: 75, churnMese: '', durataMesi: 36 });
vicino('T5 LTV con durata 36', c.ltv, 54000); vicino('T5 LTV:CAC', c.rapporto, 3.6); vero('T5 CAC paid assente senza clienti paid', c.cacPaid === null);

// T6 BDR (valori della v1)
let b = RC.bdr({ meetingMese: 10, bdr: 1, conversazioni: 10, meetingDaConv: 15, giorni: 20 });
vicino('T6 chiamate al giorno', b.chiamateGiorno, 34); vicino('T6 conversazioni al giorno', b.conversazioniGiorno, 3.33); vicino('T6 chiamate al mese', b.chiamateMese, 666.67);

// T7 copertura
let k = RC.copertura({ obiettivo: 500000, giaChiuso: 200000, pipelineAperta: 600000, winRate: 25 });
vicino('T7 mancante', k.mancante, 300000); vicino('T7 pipeline necessaria', k.necessaria, 1200000); vicino('T7 copertura', k.copertura, 2);
vicino('T7 copertura necessaria', k.coperturaNecessaria, 4); vicino('T7 buco', k.buco, 600000); vicino('T7 chiusura attesa', k.attesa, 150000);
vero('T7 obiettivo già raggiunto', RC.copertura({ obiettivo: 500000, giaChiuso: 600000, pipelineAperta: 0, winRate: 25 }).raggiunto);

// T8 velocità
let s = RC.velocita({ opp: 40, dealMedio: 20000, winRate: 25, cicloGiorni: 90 });
vicino('T8 € al giorno', s.giorno, 2222.22); vicino('T8 € al mese', s.mese, 67592.59); vicino('T8 € all\'anno', s.anno, 811111.11);

// T9 capacità e ramp
let p = RC.capacita({ quotaAnnua: 400000, raggiungimento: 80, rampMesi: 6, venditori: 3, obiettivoAnnuo: 1500000 });
vicino('T9 capacità effettiva', p.effettiva, 320000); vicino('T9 capacità attuale', p.attuali, 960000); vicino('T9 mesi pieni nel primo anno', p.mesiPieni, 9.5);
vicino('T9 contributo di un nuovo', p.nuovo, 253333.33); vicino('T9 da assumere', p.daAssumere, 3); vicino('T9 necessari a regime', p.necessariAPieno, 5);
vicino('T9 ramp 0 = 12 mesi pieni', RC.contributoPrimoAnno(0), 12);

// T10 budget paid
let g = RC.budgetPaid({ clienti: 10, cpl: 100, leadMeeting: 10, showRate: 80, oppDaMeeting: 50, winRate: 25, mesi: 5 });
vicino('T10 lead', g.lead, 1000); vicino('T10 spesa', g.spesa, 100000); vicino('T10 spesa al mese', g.spesaMese, 20000);
vicino('T10 costo meeting fissato', g.costoMeetingFissato, 1000); vicino('T10 costo meeting tenuto', g.costoMeetingTenuto, 1250); vicino('T10 costo opportunità', g.costoOpp, 2500); vicino('T10 costo cliente', g.costoCliente, 10000);

// T11 sensibilità: +1 punto vale +10%, +4%, +2%, +1,25%
let z = RC.sensibilita({ lead: 1000, leadMeeting: 10, showRate: 80, oppDaMeeting: 50, winRate: 25, dealMedio: 10000, punti: 1 });
vicino('T11 fatturato base', z.base, 100000); vicino('T11 clienti', z.clienti, 10);
vero('T11 ordine delle leve', z.leve.map(x => x.chiave).join(',') === 'leadMeeting,winRate,oppDaMeeting,showRate');
vicino('T11 +1 punto lead-meeting', z.leve[0].delta, 10000); vicino('T11 +1 punto win rate', z.leve[1].delta, 4000);
vicino('T11 +1 punto opp', z.leve[2].delta, 2000); vicino('T11 +1 punto show', z.leve[3].delta, 1250);
let z2 = RC.sensibilita({ lead: 1000, leadMeeting: 10, showRate: 100, oppDaMeeting: 50, winRate: 25, dealMedio: 10000, punti: 1 });
vicino('T11 show già al 100%: nessun guadagno', z2.leve.find(x => x.chiave === 'showRate').delta, 0);

// T12 no-show: 40 meeting fissati al mese, show 70% contro 85%, opportunità 50%, win 25%, deal 10.000
let n = RC.noShow({ meetingMese: 40, showOggi: 70, showObiettivo: 85, oppDaMeeting: 50, winRate: 25, dealMedio: 10000, leadMese: '', tassoEntro: '', tassoDopo: '', quotaTardi: '' });
vicino('T12 meeting non tenuti al mese', n.nonTenuti, 12); vicino('T12 meeting recuperabili', n.recuperabili, 6);
vicino('T12 pipeline persa al mese', n.pipelinePersaMese, 30000); vicino('T12 fatturato perso al mese', n.fatturatoPersoMese, 7500);
vicino('T12 fatturato perso all\'anno', n.fatturatoPersoAnno, 90000); vicino('T12 un punto di show al mese', n.valorePuntoMese, 500); vicino('T12 un punto all\'anno', n.valorePuntoAnno, 6000);
vero('T12 senza i campi della risposta niente seconda parte', n.risposta === null);
// T13 tempo di risposta: 200 lead, 20% entro la soglia, 8% dopo, 40% richiamati tardi
n = RC.noShow({ meetingMese: 40, showOggi: 70, showObiettivo: 85, oppDaMeeting: 50, winRate: 25, dealMedio: 10000, leadMese: 200, tassoEntro: 20, tassoDopo: 8, quotaTardi: 40 });
vicino('T13 meeting persi per i ritardi', n.risposta.meetingPersiMese, 9.6); vicino('T13 pipeline persa', n.risposta.pipelinePersaMese, 33600); vicino('T13 fatturato perso al mese', n.risposta.fatturatoPersoMese, 8400); vicino('T13 all\'anno', n.risposta.fatturatoPersoAnno, 100800);
vero('T13 tasso dopo più alto: nessuna perdita', RC.noShow({ meetingMese: 40, showOggi: 70, showObiettivo: 85, oppDaMeeting: 50, winRate: 25, dealMedio: 10000, leadMese: 200, tassoEntro: 8, tassoDopo: 20, quotaTardi: 40 }).risposta.senzaPerdita);
vero('T13 obiettivo sotto lo show di oggi: errore', !RC.noShow({ meetingMese: 40, showOggi: 70, showObiettivo: 60, oppDaMeeting: 50, winRate: 25, dealMedio: 10000 }).ok);
vero('T13 campi della risposta a metà: errore', !RC.noShow({ meetingMese: 40, showOggi: 70, showObiettivo: 85, oppDaMeeting: 50, winRate: 25, dealMedio: 10000, leadMese: 200, tassoEntro: '', tassoDopo: '', quotaTardi: '' }).ok);

// T14 provvigioni: OTE 80.000 al 60% fisso, quota 400.000, acceleratore 2, soglia 50%, margine 70%
let q = RC.provvigioni({ ote: 80000, fissoPct: 60, quotaAnnua: 400000, acceleratore: 2, soglia: 50, margine: 70 });
vicino('T14 fisso', q.fisso, 48000); vicino('T14 variabile a target', q.variabile, 32000); vicino('T14 quota:OTE', q.quotaSuOte, 5);
vicino('T14 provvigione al 50%', q.livelli[0].provvigione, 16000); vicino('T14 costo al 50%', q.livelli[0].costo, 64000); vicino('T14 costo vendite al 50%', q.livelli[0].costoPct, 32); vicino('T14 margine al 50%', q.livelli[0].margineResta, 76000);
vicino('T14 provvigione al 100%', q.livelli[1].provvigione, 32000); vicino('T14 costo vendite al 100%', q.livelli[1].costoPct, 20); vicino('T14 margine al 100%', q.livelli[1].margineResta, 200000);
vicino('T14 provvigione al 150% con acceleratore', q.livelli[2].provvigione, 64000); vicino('T14 costo vendite al 150%', q.livelli[2].costoPct, 18.67); vicino('T14 margine al 150%', q.livelli[2].margineResta, 308000);
vicino('T14 soglia 60%: al 50% niente provvigione', RC.provvigioni({ ote: 80000, fissoPct: 60, quotaAnnua: 400000, acceleratore: 2, soglia: 60, margine: 70 }).livelli[0].provvigione, 0);
vero('T14 fisso oltre 100% rifiutato', !RC.provvigioni({ ote: 80000, fissoPct: 120, quotaAnnua: 400000, acceleratore: 1, soglia: 0, margine: 70 }).ok);

// T15 sconto: prezzo 10.000, margine 60%, sconto 10%, 50 contratti
let x = RC.sconto({ prezzo: 10000, margine: 60, sconto: 10, contratti: 50 });
vicino('T15 margine per contratto prima', x.prima, 6000); vicino('T15 dopo', x.dopo, 5000); vicino('T15 contratti in più in %', x.extraPct, 20);
vicino('T15 contratti necessari', x.necessari, 60); vicino('T15 contratti in più', x.extra, 10);
vero('T15 sconto uguale al margine: impossibile', RC.sconto({ prezzo: 10000, margine: 60, sconto: 60 }).impossibile);
vero('T15 sconto oltre il margine: impossibile', RC.sconto({ prezzo: 10000, margine: 60, sconto: 70 }).impossibile);
vicino('T15 sconto 20% su margine 40%: il doppio dei contratti', RC.sconto({ prezzo: 1000, margine: 40, sconto: 20, contratti: 10 }).necessari, 20);

console.log(`\n${ok} superati, ${ko} falliti`);
process.exit(ko ? 1 : 0);
