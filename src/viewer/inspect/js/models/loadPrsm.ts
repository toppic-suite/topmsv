/**
 * Fill the inspection page inputs from a PrSM served by this dataset:
 * loads ../data/<folder>/prsms/prsm<id>.js (the PrSM json) and, through
 * ParsePrsm, its MS2 spectra from ../../topfd/ms2_json/, then extracts the
 * peak list, mass list, ion types, sequence, PTMs and precursor mass.
 * The folder path is the same ?folder= value the PrSM page uses (relative
 * to visual/ and inspect/ alike).
 * @param folder - data_js folder, e.g. ../../toppic_prsm_cutoff/data_js
 * @param prsmId - PrSM id
 * @param specId - MS2 spectrum id; null = the PrSM's first spectrum
 */
function loadPrsmForInspect(folder: string, prsmId: string, specId: string | null): void {
    let script: HTMLScriptElement = document.createElement('script');
    script.src = "../data/" + folder + "/prsms/prsm" + prsmId + ".js";
    script.onload = function (): void {
        let parser: ParsePrsm = new ParsePrsm(false, null, true, "../../topfd/ms2_json/");
        parser.geneDataObj((prsmObj: Prsm): void => {
            let data: InspectData | null = extractInspectData(prsmObj, specId);
            if (!data) {
                return;
            }
            setDataToPeakAndIntensity(data.peakAndIntensityList.join("\n"));
            setDataToMassAndIntensity(data.massAndIntensityList.join("\n"));
            setDataToSequence(data.sequence, data.unknownMassShiftList, data.protVarPtmsList, data.variablePtmsList);
            setFixedMasses(data.fixedPtmList);
            setPrecursorMass(parseFloat(data.precursorMass));
            setIonCheckbox(data.ionList.length > 0 ? data.ionList.join(",") : null);
        });
    };
    script.onerror = function (): void {
        console.error("ERROR: cannot load PrSM data file " + script.src);
    };
    document.head.appendChild(script);
}
