# Calcolatori RevOps

Le formule dei conti che uso sul fatturato, in un file JavaScript solo, senza dipendenze: funnel a ritroso, CAC completo con payback e LTV, chiamate al giorno di chi fa outbound, copertura di pipeline, velocità di vendita, capacità e ramp dei venditori, budget delle campagne a ritroso, quale tasso sposta di più, costo dei no-show e dei lead richiamati tardi, piano provvigioni, sconto contro volume.

Ogni funzione controlla gli input (vuoti, zero, percentuali oltre 100) e restituisce i risultati con gli errori campo per campo. I casi di test sono fatti a mano e si lanciano con `node test_revops_calc.js`: oggi passano 101 su 101.

Sono gli stessi conti dell'[Officina](https://lorenzoasuni.com/officina.html) sul mio sito, dove ogni risultato mostra come è calcolato.

## Come si usa

Con Node:

```js
const RC = require('./revops_calc.js');

const f = RC.funnel({
  obiettivo: 300000,      // fatturato nuovo da chiudere nel periodo, in euro
  dealMedio: 15000,       // valore medio di un contratto
  winRate: 25,            // su 100 opportunità, quante firmano
  oppDaMeeting: 50,       // su 100 meeting tenuti, quante opportunità
  showRate: 80,           // su 100 meeting fissati, quanti si tengono
  meetingDaContatto: 10,  // su 100 lead o conversazioni, quanti meeting fissati
  mesi: 6
});

console.log(f.deal, f.fissati, f.contatti); // 20 200 2000
```

Nel browser basta caricare il file con un tag `script`: le funzioni stanno in `RC`.

Le percentuali entrano come numeri da 0 a 100. Ogni funzione restituisce un oggetto con `ok`, `errori` (uno per campo sbagliato) e i risultati.

## Le funzioni

`funnel`, `cac`, `bdr`, `copertura`, `velocita`, `capacita`, `contributoPrimoAnno`, `budgetPaid`, `sensibilita`, `noShow`, `provvigioni`, `sconto`. I campi di ognuna si leggono in cima alla funzione, nella riga che li controlla.

I numeri degli esempi sono valori di prova, non medie di mercato: metti i tuoi.

## Licenza

MIT, vedi [LICENSE](LICENSE). Puoi copiarlo, cambiarlo e usarlo in azienda.

Lorenzo Asuni
