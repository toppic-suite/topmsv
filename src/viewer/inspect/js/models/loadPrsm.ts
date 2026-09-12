/**
 * Loading the inspection page inputs from this dataset, either from a PrSM
 * (?folder=&prsm_id=[&spec_id=] or the "Load from this dataset" form) or from
 * a bare MS2 spectrum (?spec_id= alone, or the form with "Spectrum ID").
 */

// data_js folder used when the page URL has no ?folder= (the prsm cutoff
// tree holds every PrSM)
const DEFAULT_INSPECT_FOLDER: string = "../../toppic_prsm_cutoff/data_js";

/** Message next to the Load button (no-op when the form is absent). */
function setLoadStatus(message: string, isError: boolean = false): void {
    let status: HTMLElement | null = document.getElementById("load_status");
    if (!status) {
        return;
    }
    status.textContent = message;
    status.style.color = isError ? "#b00020" : "";
}

/** Uncheck every ion type before applying a loaded ion list. */
function clearIonCheckboxes(): void {
    let ionsAll: HTMLCollectionOf<HTMLInputElement> = domElements.customControlInput;
    for (let i = 0; i < ionsAll.length; i++) {
        ionsAll[i].checked = false;
    }
}

/** Keep the page URL in sync with what is loaded so it can be reloaded or bookmarked. */
function setInspectUrl(params: { [k: string]: string }): void {
    let search: URLSearchParams = new URLSearchParams();
    for (let key in params) {
        search.set(key, params[key]);
    }
    window.history.replaceState(null, "", window.location.pathname + "?" + search.toString());
}

/**
 * Fill the inputs from a PrSM served by this dataset: loads
 * ../data/<folder>/prsms/prsm<id>.js (the PrSM json) and, through ParsePrsm,
 * its MS2 spectra from ../../topfd/ms2_json/, then extracts the peak list,
 * mass list, ion types, sequence, PTMs and precursor mass. The folder path
 * is the same ?folder= value the PrSM page uses (relative to visual/ and
 * inspect/ alike).
 * @param folder - data_js folder, e.g. ../../toppic_prsm_cutoff/data_js
 * @param prsmId - PrSM id
 * @param specId - MS2 spectrum id; null = the PrSM's first spectrum
 */
function loadPrsmForInspect(folder: string, prsmId: string, specId: string | null): void {
    setLoadStatus("Loading PrSM " + prsmId + "...");
    let script: HTMLScriptElement = document.createElement('script');
    script.src = "../data/" + folder + "/prsms/prsm" + prsmId + ".js";
    script.onload = function (): void {
        let parser: ParsePrsm = new ParsePrsm(false, null, true, "../../topfd/ms2_json/");
        parser.geneDataObj((prsmObj: Prsm): void => {
            let data: InspectData | null = extractInspectData(prsmObj, specId);
            if (!data) {
                setLoadStatus("PrSM " + prsmId + " has no spectrum " + specId, true);
                return;
            }
            setDataToPeakAndIntensity(data.peakAndIntensityList.join("\n"));
            setDataToMassAndIntensity(data.massAndIntensityList.join("\n"));
            setDataToSequence(data.sequence, data.unknownMassShiftList, data.protVarPtmsList, data.variablePtmsList);
            setFixedMasses(data.fixedPtmList);
            setPrecursorMass(parseFloat(data.precursorMass));
            clearIonCheckboxes();
            setIonCheckbox(data.ionList.length > 0 ? data.ionList.join(",") : null);
            setLoadStatus("Loaded PrSM " + prsmId + " (scan " + data.scan + ")");
        });
    };
    script.onerror = function (): void {
        setLoadStatus("PrSM " + prsmId + " was not found in " + folder, true);
    };
    document.head.appendChild(script);
}

/**
 * Fill the peak list, mass list and ion types from one MS2 spectrum of this
 * dataset's sqlite (the dataset JSON API under ../../api/). The sequence,
 * PTMs and precursor mass are left as they are: a bare spectrum carries no
 * identification and the sqlite stores no precursor mass.
 * @param specId - TopFD MS2 spectrum id (as in the raw-spectra browser)
 */
function loadSpectrumForInspect(specId: string): void {
    setLoadStatus("Loading spectrum " + specId + "...");
    let api: string = "../../api/";
    let getJson = (path: string): Promise<any> => fetch(api + path).then((r) => {
        if (!r.ok) {
            throw new Error(path + ": HTTP " + r.status);
        }
        return r.json();
    });
    Promise.all([getJson("ms2-info/" + specId), getJson("ms2-peaks/" + specId), getJson("ms2-envs/" + specId)])
        .then(([info, peaks, envs]: [any, any[], any[]]) => {
            if (!info) {
                setLoadStatus("Spectrum " + specId + " was not found", true);
                return;
            }
            let peakLines: string[] = peaks.map((p: any) => p.mz + " " + p.intensity);
            envs.sort((x: any, y: any) => x.env_id - y.env_id);
            let massLines: string[] = envs.map((e: any) => e.mono_mass + " " + e.intensity + " " + e.charge);
            setDataToPeakAndIntensity(peakLines.join("\n"));
            setDataToMassAndIntensity(massLines.join("\n"));
            clearIonCheckboxes();
            let ions: string[] = [];
            if (info.n_ion_type) ions.push(info.n_ion_type);
            if (info.c_ion_type) ions.push(info.c_ion_type);
            setIonCheckbox(ions.length > 0 ? ions.join(",") : null);
            setLoadStatus("Loaded spectrum " + specId + " (scan " + info.scan + "); sequence and precursor mass unchanged");
        })
        .catch((err: Error) => {
            console.error(err);
            setLoadStatus("Spectrum " + specId + " could not be loaded", true);
        });
}

/**
 * Wire the "Load from this dataset" form: PrSM ID loads a PrSM (first
 * spectrum) from the page's ?folder= or the default folder, Spectrum ID
 * loads a bare MS2 spectrum. The URL is updated to match.
 * @param folder - the page's ?folder= value, if any
 */
function bindLoadByIdForm(folder: string | null): void {
    let typeSelect: HTMLSelectElement | null = <HTMLSelectElement>document.getElementById("load_type");
    let idInput: HTMLInputElement | null = <HTMLInputElement>document.getElementById("load_id");
    let button: HTMLElement | null = document.getElementById("load_btn");
    if (!typeSelect || !idInput || !button) {
        return;
    }
    let dataFolder: string = folder ? folder : DEFAULT_INSPECT_FOLDER;
    let load = (): void => {
        let id: string = idInput.value.trim();
        if (id === "" || !/^\d+$/.test(id)) {
            setLoadStatus("Enter a non-negative integer ID", true);
            return;
        }
        if (typeSelect.value === "prsm") {
            setInspectUrl({ folder: dataFolder, prsm_id: id });
            loadPrsmForInspect(dataFolder, id, null);
        }
        else {
            setInspectUrl({ spec_id: id });
            loadSpectrumForInspect(id);
        }
    };
    button.addEventListener("click", load);
    idInput.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            load();
        }
    });
}
