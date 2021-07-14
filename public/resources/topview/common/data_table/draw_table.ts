/**
 * Build the monomass table with all the data from the peak variable of the prsm_data
 * Provide a unique class name to the m/z values to provide on click action to xoom the
 * spectrum graph to that position
 */
class DataTable {
  private prsmObj_: Prsm;
  constructor(prsmObj: Prsm) {
    this.prsmObj_ = prsmObj;
  }
  drawTable(): void {
    let peakCnt: number = 0;
    let ms2Spectrum: Spectrum[] | null = this.prsmObj_.getMs2Spectra();
    let seqLength = this.prsmObj_.getProteoform().getLastPos() - this.prsmObj_.getProteoform().getFirstPos() + 1; 
    if (!ms2Spectrum) {
      console.error("ERROR: invalid ms2 spectrum");
      return;
    }
    let table: HTMLElement = <HTMLElement>document.getElementById('spectrum');
    let tbdy: HTMLTableSectionElement = document.createElement('tbody');
    let l_scans: string[] = ms2Spectrum[0].getScanNum().split(" ");
    let l_specIds: string[] = ms2Spectrum[0].getSpectrumId().split(" ");
    let l_matched_peak_count: number = 0;
    let l_duc_peak_count: number = 0;
    let recordedPeaks: string[] = []; //Id of peaks that were matched by more than 1 ion
        
    ms2Spectrum.forEach((spectra) => {
      let specId: string = spectra.getSpectrumId();
      let decovPeaks: Peak[] | null = spectra.getDeconvPeaks();
      if (!decovPeaks) {
        console.error("ERROR: no deconvoluted peaks in ms2 spectrum");
        return;
      }
      let peakId: string[] = [];

      this.prsmObj_.getMatchedPeakEnvelopePairs().forEach((matchedPeakPair) => {
        peakId.push(matchedPeakPair.getPeak().getId());
        loop_matched_ions(matchedPeakPair.getPeak(), specId, true, matchedPeakPair, seqLength);
        peakCnt++;
      })
      decovPeaks.forEach((deconvPeak) => {
        if (peakId.indexOf(deconvPeak.getId()) < 0) {
          loop_matched_ions(deconvPeak, specId, false);
          peakCnt++;
        }
      })
    })
    //after looping through the prsm files, store the ion type data to local storage
    //window.localStorage.setItem('ionType', ionArray.toString());
    /**
     * Inner function to create a rows and columns for monomass table
     * @param {object} peak - contains information of each peak
     * @param {int} i - index of the peak
     */
    function loop_matched_ions(peak: Peak, specId: string, matchedPeaks: boolean, 
      matchedPeakPair?: MatchedPeakEnvelopePair, seqLen?: number) {
    /*Create row for each peak value object in the table*/
      var tr: HTMLTableRowElement = document.createElement('tr');
      let id: string = specId + "peak" + peak.getId();
      let l_scan: string;
      let l_class: string;
        
      if((parseInt(peak.getId()) + 1)%2 == 0){
		// class name helps to get unmatched peaks when clicking unmatched peaks
		l_class = "unmatched_peak even"; 
	  }
	  else{
		// class name helps to get unmatched peaks when clicking unmatched peaks
		l_class = "unmatched_peak odd"; 
	  }
      if (matchedPeaks && matchedPeakPair) {
        id = id + matchedPeakPair.getIon().getName();
        if ((parseInt(peak.getId()) + 1) % 2 == 0) {
          // class name helps to get matched peaks when clicking matched peaks
          l_class = "matched_peak even";
        }
        else {
          // class name helps to get matched peaks when clicking matched peaks
          l_class = "matched_peak odd";
        }
        l_matched_peak_count++;
          //	create a name for each row
          let ionPos: string = matchedPeakPair.getIon().getId();
          tr.setAttribute("name", ionPos.slice(1));
          let peakId: string = peak.getId();
          if (recordedPeaks.indexOf(peakId) < 0) {
            recordedPeaks.push(peakId);  
          }
          else{
            l_duc_peak_count++;
          }
      }
      //	Set "id","class name" and "role" for each row
      tr.setAttribute("id", id);
      tr.setAttribute("class", l_class);
      tr.setAttribute("role", "row");
      for (let i = 0; i < 11; i++) {
        var td: HTMLTableDataCellElement = document.createElement('td');
        td.setAttribute("align", "center");
        if (i == 0) {
          if (specId == l_specIds[0])
            l_scan = l_scans[0];
          else
            l_scan = l_scans[1];
            td.setAttribute("class", "row_scanIds");
            td.innerHTML = l_scan;
        }
        if (i == 1) {
          td.innerHTML = (parseInt(peak.getId()) + 1).toString();
          td.setAttribute("class", "row_peakNum");
        }
        if (i == 2) {
          let monoMass: number | undefined = peak.getMonoMass();
          if (!monoMass) {
            console.error("ERROR: mono peak does not have mono mass");
            return;
          }
          td.innerHTML = monoMass.toString();
          td.setAttribute("class", "row_monoMass");
        }
        if (i == 3) {
          //	provide link to click on m/z value to view spectrum 
          let a: HTMLAnchorElement = document.createElement('a');
          a.href = "#!";
          a.className = "row_mono_mz";
          a.innerHTML = peak.getMonoMz().toString();
          td.appendChild(a);
        }
        if (i == 4) {
          td.innerHTML = peak.getIntensity().toString();
          td.setAttribute("class", "row_intensity");
        }
        if (i == 5) {
          let charge: number | undefined = peak.getCharge();
          if (!charge) {
            console.error("ERROR: mono peak does not have charge");
            return;
          }
          td.innerHTML = charge.toString();
          td.setAttribute("class", "row_charge");
        }
        if (matchedPeaks && matchedPeakPair) {
          if (i == 6) {
            td.innerHTML = matchedPeakPair.getTheoMass().toString();
          }
          if (i == 7) {
            let ionPos: string = matchedPeakPair.getIon().getId();
            td.innerHTML = matchedPeakPair.getIon().getName() + ionPos.slice(1);
          }
          if (i == 8) {
          //if c-term ion, pos = pos + 1
            let ion: string = matchedPeakPair.getIon().getName();
            let ionPos: number = parseInt((matchedPeakPair.getIon().getId()).slice(1));
            if (ion.indexOf("X") >= 0 || ion.indexOf("Y") >= 0 || ion.indexOf("Z") >= 0) {
              if (seqLen){
                td.innerHTML = (seqLen - (ionPos) + 1).toString();
              }
              else{
                console.error("ERROR: seqLen is not provided");
              }
            }
            else {
              td.innerHTML = ionPos.toString();
            }
          }
          if (i == 9) {
            let massError: number | undefined = matchedPeakPair.getIon().getMassError();
            if (massError) {
              td.innerHTML = massError.toString();
            }
            else{
              console.error("ERROR: massError is not provided");
            }
          }
          if (i == 10) {
            let ppmError: number | undefined = matchedPeakPair.getIon().getPpmError();
            if (ppmError) {
              td.innerHTML = ppmError.toString();
            }
            else{
              console.error("ERROR: ppmError is not provided");
            }
          }
        }
          tr.appendChild(td);
        }
        tbdy.appendChild(tr);
    }
    let l_All_Peaks: number = peakCnt;
    l_matched_peak_count = l_matched_peak_count - l_duc_peak_count;
    let l_not_matched_peak_count: number = l_All_Peaks - l_matched_peak_count;

    if (document.getElementById("all_peak_count")) {
      document.getElementById("all_peak_count")!.innerHTML = "All peaks (" + l_All_Peaks.toString() + ")";
    }
    if (document.getElementById("matched_peak_count")) {
      document.getElementById("matched_peak_count")!.innerHTML = "Matched peaks (" + l_matched_peak_count.toString() + ")";
    }
    if (document.getElementById("not_matched_peak_count")) {
      document.getElementById("not_matched_peak_count")!.innerHTML = "Not Matched peaks (" + l_not_matched_peak_count.toString() + ")";
    }
    if (!table) {
      console.error("ERROR: table element is not created correctly");
      return;
    }
    table.appendChild(tbdy);
  }
}
