/* Calcolatori RevOps dell'Officina: solo formule, nessun DOM.
   Lo stesso file viene incollato nelle pagine da build_officina.py e testato con node (test_revops_calc.js).
   Convenzioni: le percentuali entrano come numeri da 0 a 100; ogni funzione restituisce { ok, errori, ... }. */
(function (root) {
  'use strict';

  /* Validazione: vuoto, non numerico, sotto il minimo, sopra il massimo, percentuali oltre 100 */
  function controlla(valori, regole) {
    var errori = {};
    Object.keys(regole).forEach(function (k) {
      var r = regole[k], v = valori[k];
      if (r.facoltativo && (v === '' || v === null || v === undefined)) return;
      if (v === '' || v === null || v === undefined || isNaN(+v)) { errori[k] = 'Inserisci un numero'; return; }
      v = +v;
      if (r.pct && (v <= 0 || v > 100)) { errori[k] = 'Una percentuale tra 0 e 100, zero escluso'; return; }
      if (r.pct0 && (v < 0 || v > 100)) { errori[k] = 'Una percentuale tra 0 e 100'; return; }
      if (r.pos && v <= 0) { errori[k] = 'Serve un numero maggiore di zero'; return; }
      if (r.min0 && v < 0) { errori[k] = 'Non può essere negativo'; return; }
      if (r.max !== undefined && v > r.max) { errori[k] = 'Al massimo ' + r.max; return; }
      if (r.intero && Math.floor(v) !== v) { errori[k] = 'Serve un numero intero'; return; }
    });
    return errori;
  }
  function esito(errori, dati) { var ok = Object.keys(errori).length === 0; dati = dati || {}; dati.ok = ok; dati.errori = errori; return dati; }
  var SETTIMANE_MESE = 52 / 12;   /* 4,33 */
  var GIORNI_MESE = 365 / 12;     /* 30,42 */

  /* 1. Funnel a ritroso: dal fatturato nuovo alle attività */
  function funnel(v) {
    var e = controlla(v, {
      obiettivo: { pos: 1 }, dealMedio: { pos: 1 }, winRate: { pct: 1 }, oppDaMeeting: { pct: 1 },
      showRate: { pct: 1 }, meetingDaContatto: { pct: 1 }, mesi: { pos: 1, max: 36 },
      venditori: { pos: 1, intero: 1, facoltativo: 1 }, cicloGiorni: { min0: 1, facoltativo: 1 }
    });
    if (Object.keys(e).length) return esito(e);
    var deal = Math.ceil(v.obiettivo / v.dealMedio);
    var opp = deal / (v.winRate / 100);
    var tenuti = opp / (v.oppDaMeeting / 100);
    var fissati = tenuti / (v.showRate / 100);
    var contatti = fissati / (v.meetingDaContatto / 100);
    var mesi = +v.mesi, vend = v.venditori ? +v.venditori : 1;
    var giorniPeriodo = mesi * GIORNI_MESE;
    var ciclo = v.cicloGiorni ? +v.cicloGiorni : 0;
    var giorniUtili = giorniPeriodo - ciclo;
    var r = {
      deal: deal, opp: opp, tenuti: tenuti, fissati: fissati, contatti: contatti,
      pipeline: opp * v.dealMedio,
      fissatiMese: fissati / mesi, fissatiSettimana: fissati / (mesi * SETTIMANE_MESE),
      contattiSettimana: contatti / (mesi * SETTIMANE_MESE),
      tenutiMesePerVenditore: tenuti / mesi / vend, dealPerVenditore: deal / vend,
      giorniUtili: giorniUtili,
      fissatiSettimanaUtile: giorniUtili > 0 ? fissati / (giorniUtili / 7) : null,
      pipelineGiaServe: giorniUtili <= 0
    };
    return esito(e, r);
  }

  /* 2. CAC completo, payback e LTV */
  function cac(v) {
    var e = controlla(v, {
      paidMese: { min0: 1 }, strumentiMese: { min0: 1 }, eventiMese: { min0: 1 }, agenzieMese: { min0: 1 },
      costoPersoneAnno: { min0: 1 }, quotaTempo: { pct0: 1 }, provvigioni: { min0: 1 }, mesi: { pos: 1, max: 36 },
      clientiNuovi: { pos: 1 }, clientiPaid: { min0: 1, facoltativo: 1 },
      ricavoMeseCliente: { pos: 1 }, margine: { pct: 1 }, churnMese: { pct0: 1, facoltativo: 1 }, durataMesi: { pos: 1, facoltativo: 1 }
    });
    if (!Object.keys(e).length && !(+v.churnMese > 0) && !(+v.durataMesi > 0)) e.durataMesi = 'Serve il churn mensile o la durata media';
    if (Object.keys(e).length) return esito(e);
    var programma = (+v.paidMese + +v.strumentiMese + +v.eventiMese + +v.agenzieMese) * v.mesi;
    var persone = v.costoPersoneAnno * (v.quotaTempo / 100) * v.mesi / 12;
    var totale = programma + persone + +v.provvigioni;
    var cacBlended = totale / v.clientiNuovi;
    var cacPaid = v.clientiPaid > 0 ? (v.paidMese * v.mesi) / v.clientiPaid : null;
    var margineMese = v.ricavoMeseCliente * (v.margine / 100);
    var durata = +v.churnMese > 0 ? 100 / v.churnMese : +v.durataMesi;
    var ltv = margineMese * durata;
    return esito(e, {
      programma: programma, persone: persone, totale: totale, cacBlended: cacBlended, cacPaid: cacPaid,
      payback: cacBlended / margineMese, durata: durata, ltv: ltv, rapporto: ltv / cacBlended
    });
  }

  /* 3. Chiamate al giorno del BDR (quello di prima, invariato) */
  function bdr(v) {
    var e = controlla(v, { meetingMese: { pos: 1 }, bdr: { pos: 1, intero: 1 }, conversazioni: { pct: 1 }, meetingDaConv: { pct: 1 }, giorni: { pos: 1, max: 31 } });
    if (Object.keys(e).length) return esito(e);
    var mese = v.meetingMese / ((v.conversazioni / 100) * (v.meetingDaConv / 100));
    return esito(e, {
      chiamateGiorno: Math.ceil(mese / v.giorni / v.bdr),
      conversazioniGiorno: (mese * v.conversazioni / 100) / v.giorni / v.bdr,
      chiamateMese: mese
    });
  }

  /* 4. Copertura di pipeline */
  function copertura(v) {
    var e = controlla(v, { obiettivo: { pos: 1 }, giaChiuso: { min0: 1 }, pipelineAperta: { min0: 1 }, winRate: { pct: 1 } });
    if (Object.keys(e).length) return esito(e);
    var mancante = v.obiettivo - v.giaChiuso;
    if (mancante <= 0) return esito(e, { mancante: 0, raggiunto: true, necessaria: 0, copertura: null, coperturaNecessaria: 100 / v.winRate, buco: 0, attesa: v.pipelineAperta * v.winRate / 100 });
    var necessaria = mancante / (v.winRate / 100);
    return esito(e, {
      mancante: mancante, raggiunto: false, necessaria: necessaria,
      copertura: v.pipelineAperta / mancante, coperturaNecessaria: 100 / v.winRate,
      buco: Math.max(0, necessaria - v.pipelineAperta), attesa: v.pipelineAperta * v.winRate / 100
    });
  }

  /* 5. Velocità di vendita */
  function velocita(v) {
    var e = controlla(v, { opp: { pos: 1 }, dealMedio: { pos: 1 }, winRate: { pct: 1 }, cicloGiorni: { pos: 1 } });
    if (Object.keys(e).length) return esito(e);
    var giorno = v.opp * v.dealMedio * (v.winRate / 100) / v.cicloGiorni;
    return esito(e, { giorno: giorno, mese: giorno * GIORNI_MESE, anno: giorno * 365 });
  }

  /* 6. Capacità dei venditori e ramp dei nuovi */
  function contributoPrimoAnno(ramp) {
    /* produttività che sale in linea retta fino al 100% al mese "ramp", poi piena; somma dei 12 mesi in mesi pieni */
    var s = 0;
    for (var m = 1; m <= 12; m++) s += ramp > 0 ? Math.min(m / ramp, 1) : 1;
    return s;
  }
  function capacita(v) {
    var e = controlla(v, { quotaAnnua: { pos: 1 }, raggiungimento: { pct: 1, max: 100 }, rampMesi: { min0: 1, max: 12, intero: 1 }, venditori: { min0: 1, intero: 1 }, obiettivoAnnuo: { pos: 1 } });
    if (Object.keys(e).length) return esito(e);
    var effettiva = v.quotaAnnua * v.raggiungimento / 100;
    var attuali = v.venditori * effettiva;
    var mesiPieni = contributoPrimoAnno(+v.rampMesi);
    var nuovo = effettiva * mesiPieni / 12;
    var mancante = Math.max(0, v.obiettivoAnnuo - attuali);
    return esito(e, {
      effettiva: effettiva, attuali: attuali, mesiPieni: mesiPieni, nuovo: nuovo, mancante: mancante,
      daAssumere: mancante > 0 ? Math.ceil(mancante / nuovo) : 0,
      necessariAPieno: Math.ceil(v.obiettivoAnnuo / effettiva)
    });
  }

  /* 7. Budget paid a ritroso */
  function budgetPaid(v) {
    var e = controlla(v, { clienti: { pos: 1 }, cpl: { pos: 1 }, leadMeeting: { pct: 1 }, showRate: { pct: 1 }, oppDaMeeting: { pct: 1 }, winRate: { pct: 1 }, mesi: { pos: 1, max: 36 } });
    if (Object.keys(e).length) return esito(e);
    var p = function (k) { return v[k] / 100; };
    var lead = v.clienti / (p('leadMeeting') * p('showRate') * p('oppDaMeeting') * p('winRate'));
    var spesa = lead * v.cpl;
    return esito(e, {
      lead: lead, spesa: spesa, spesaMese: spesa / v.mesi,
      costoMeetingFissato: v.cpl / p('leadMeeting'),
      costoMeetingTenuto: v.cpl / (p('leadMeeting') * p('showRate')),
      costoOpp: v.cpl / (p('leadMeeting') * p('showRate') * p('oppDaMeeting')),
      costoCliente: spesa / v.clienti
    });
  }

  /* 8. Sensibilità: un punto in più su ogni tasso, quanto fatturato sposta */
  var TASSI = [['leadMeeting', 'Da lead a meeting'], ['showRate', 'Show rate'], ['oppDaMeeting', 'Da meeting a opportunità'], ['winRate', 'Win rate']];
  function sensibilita(v) {
    var regole = { lead: { pos: 1 }, dealMedio: { pos: 1 }, punti: { pos: 1, max: 20 } };
    TASSI.forEach(function (t) { regole[t[0]] = { pct: 1 }; });
    var e = controlla(v, regole);
    if (Object.keys(e).length) return esito(e);
    function fatt(x) { return v.lead * TASSI.reduce(function (a, t) { return a * x[t[0]] / 100; }, 1) * v.dealMedio; }
    var base = fatt(v);
    var leve = TASSI.map(function (t) {
      var x = {}; TASSI.forEach(function (u) { x[u[0]] = +v[u[0]]; });
      x[t[0]] = Math.min(100, x[t[0]] + +v.punti);
      var f = fatt(x);
      return { chiave: t[0], nome: t[1], da: +v[t[0]], a: x[t[0]], fatturato: f, delta: f - base, deltaPct: (f - base) / base * 100 };
    }).sort(function (a, b) { return b.delta - a.delta; });
    return esito(e, { base: base, clienti: base / v.dealMedio, leve: leve });
  }


  /* 9. Costo dei no-show e dei lead lasciati raffreddare */
  function noShow(v) {
    var e = controlla(v, { meetingMese: { pos: 1 }, showOggi: { pct: 1 }, showObiettivo: { pct: 1 }, oppDaMeeting: { pct: 1 }, winRate: { pct: 1 }, dealMedio: { pos: 1 },
      leadMese: { pos: 1, facoltativo: 1 }, tassoEntro: { pct0: 1, facoltativo: 1 }, tassoDopo: { pct0: 1, facoltativo: 1 }, quotaTardi: { pct0: 1, facoltativo: 1 } });
    if (!Object.keys(e).length && +v.showObiettivo < +v.showOggi) e.showObiettivo = 'L\'obiettivo deve essere almeno lo show rate di oggi';
    var b = ['leadMese', 'tassoEntro', 'tassoDopo', 'quotaTardi'], pieni = b.filter(function (k) { return v[k] !== '' && v[k] !== null && v[k] !== undefined; }).length;
    if (!Object.keys(e).length && pieni > 0 && pieni < 4) b.forEach(function (k) { if (v[k] === '' || v[k] === null || v[k] === undefined) e[k] = 'Per il tempo di risposta servono tutti e quattro i campi'; });
    if (Object.keys(e).length) return esito(e);
    var o = v.oppDaMeeting / 100, w = v.winRate / 100, d = +v.dealMedio;
    var nonTenuti = v.meetingMese * (1 - v.showOggi / 100);
    var recuperabili = v.meetingMese * (v.showObiettivo - v.showOggi) / 100;
    var r = {
      nonTenuti: nonTenuti, recuperabili: recuperabili,
      pipelinePersaMese: recuperabili * o * d, fatturatoPersoMese: recuperabili * o * w * d,
      fatturatoPersoAnno: recuperabili * o * w * d * 12,
      valorePuntoMese: v.meetingMese * 0.01 * o * w * d, valorePuntoAnno: v.meetingMese * 0.01 * o * w * d * 12,
      risposta: null
    };
    if (pieni === 4) {
      var diff = Math.max(0, (v.tassoEntro - v.tassoDopo) / 100);
      var meetingPersi = v.leadMese * (v.quotaTardi / 100) * diff;
      r.risposta = { senzaPerdita: diff === 0, meetingPersiMese: meetingPersi,
        pipelinePersaMese: meetingPersi * (v.showOggi / 100) * o * d,
        fatturatoPersoMese: meetingPersi * (v.showOggi / 100) * o * w * d };
      r.risposta.fatturatoPersoAnno = r.risposta.fatturatoPersoMese * 12;
    }
    return esito(e, r);
  }

  /* 10. Piano provvigioni */
  function provvigioni(v) {
    var e = controlla(v, { ote: { pos: 1 }, fissoPct: { pct0: 1 }, quotaAnnua: { pos: 1 }, acceleratore: { pos: 1, max: 5 }, soglia: { pct0: 1 }, margine: { pct: 1 } });
    if (Object.keys(e).length) return esito(e);
    var fisso = v.ote * v.fissoPct / 100, variabile = v.ote - fisso, soglia = v.soglia / 100;
    function livello(a) {
      var prov = a < soglia ? 0 : (a <= 1 ? variabile * a : variabile * (1 + (a - 1) * v.acceleratore));
      var costo = fisso + prov, fatt = v.quotaAnnua * a;
      return { raggiungimento: a * 100, provvigione: prov, costo: costo, fatturato: fatt, costoPct: costo / fatt * 100, margineResta: fatt * v.margine / 100 - costo };
    }
    return esito(e, { fisso: fisso, variabile: variabile, quotaSuOte: v.quotaAnnua / v.ote, livelli: [livello(0.5), livello(1), livello(1.5)] });
  }

  /* 11. Sconto contro volume */
  function sconto(v) {
    var e = controlla(v, { prezzo: { pos: 1 }, margine: { pct: 1 }, sconto: { pct0: 1 }, contratti: { pos: 1, facoltativo: 1 } });
    if (Object.keys(e).length) return esito(e);
    var m = v.margine / 100, s = v.sconto / 100;
    var prima = v.prezzo * m, dopo = v.prezzo * (m - s);
    if (s >= m) return esito(e, { impossibile: true, prima: prima, dopo: dopo, prezzoScontato: v.prezzo * (1 - s) });
    var fattore = m / (m - s);
    var r = { impossibile: false, prima: prima, dopo: dopo, prezzoScontato: v.prezzo * (1 - s), fattore: fattore, extraPct: (fattore - 1) * 100 };
    if (v.contratti) { r.necessari = Math.ceil(v.contratti * fattore - 1e-9); r.extra = r.necessari - v.contratti; }
    return esito(e, r);
  }

  var api = { controlla: controlla, funnel: funnel, cac: cac, bdr: bdr, copertura: copertura, velocita: velocita, capacita: capacita, contributoPrimoAnno: contributoPrimoAnno, budgetPaid: budgetPaid, sensibilita: sensibilita, noShow: noShow, provvigioni: provvigioni, sconto: sconto, SETTIMANE_MESE: SETTIMANE_MESE, GIORNI_MESE: GIORNI_MESE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.RC = api;
})(this);
