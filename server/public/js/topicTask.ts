(function () {
  //console.log(projectCode.value);
  let upload: HTMLButtonElement | null = document.querySelector<HTMLButtonElement>('#submitButton');
  let progress: HTMLDivElement | null = document.querySelector<HTMLDivElement>('#progressbar');
  let xhr: XMLHttpRequest = new XMLHttpRequest();
  
  if (upload) {
    upload.addEventListener('click', uploadFile, false);
  } else {
    console.error("upload button cannot be found");
  }

  // 点击上传
  function uploadFile(): void {
    //console.log("uploadFile");
    //console.log(ValidateEmail(email.value));
    let fastaFile: HTMLInputElement | null = document.querySelector<HTMLInputElement>('#Protein_Database_Fasta');
    let fixedPTMFile: HTMLInputElement | null = document.querySelector<HTMLInputElement>('#Fixed_PTMs');
    let ptmShiftFile: HTMLInputElement | null = document.querySelector<HTMLInputElement>('#PTMs_Shifts');

    let projectCode: HTMLInputElement | null = document.querySelector<HTMLInputElement>('#projectCode');

    let Activation: string | number | string[] | undefined = $("#Activation").val();
    let Fixed_mod: string | number | string[] | undefined = $("#Fixed_mod").val();
    let N_terminal_form_option_0: JQuery<HTMLElement> = $('#N_terminal_form_option_0_');
    let N_terminal_form_option_1: JQuery<HTMLElement> = $('#N_terminal_form_option_1_');
    let N_terminal_form_option_2: JQuery<HTMLElement> = $('#N_terminal_form_option_2_');
    let N_terminal_form_option_4: JQuery<HTMLElement> = $('#N_terminal_form_option_3_');
    let Decoy_option: JQuery<HTMLElement> = $('#Decoy_option');

    let Mass_error_tolerance: string | number | string[] | undefined = $('#Mass_error_tolerance').val();
    let Proteoform_error_tolerance: string | number | string[] | undefined = $('#Proteoform_error_tolerance').val();
    let Max_shift: string | number | string[] | undefined = $('#Max_shift').val();
    let Min_shift: string | number | string[] | undefined = $('#Min_shift').val();
    let Max_unexpected_mass_shift: string | number | string[] | undefined = $('#Max_unexpected_mass_shift').val();
    let Spectrum_cutoff_type: string | number | string[] | undefined = $('#Spectrum_cutoff_type').val();
    let Spectrum_cutoff_value: string | number | string[] | undefined = $('#Spectrum_cutoff_value').val();
    let Proteoform_cutoff_type: string | number | string[] | undefined = $('#Proteoform_cutoff_type').val();
    let Proteoform_cutoff_value: string | number | string[] | undefined = $('#Proteoform_cutoff_value').val();
    let Lookup_table: JQuery<HTMLElement> = $('#Lookup_table');
    let Combined_spectra: string | number | string[] | undefined = $('#Combined_spectra').val();
    let Miscore_threshold: string | number | string[] | undefined = $('#Miscore_threshold').val();
    let No_TopFD_feature: JQuery<HTMLElement> = $('#No_TopFD_feature');
    let Gene_mzid: JQuery<HTMLElement> = $('#Gene_mzid');

    let threadNum: HTMLSelectElement | null = document.querySelector<HTMLSelectElement>('#threadNum');

    let isMzidGenerated: boolean = false;
    let isDecoyGenerated: boolean = false;

    if (!fastaFile) {
      console.error("invalid fasta file");
      return;
    }

    if (!projectCode) {
      console.error("invalid project code");
      return;
    }

    if (!threadNum) {
      console.error("invalid thread number");
      return;
    }

    let command: string = '';
    if (Activation !== '' && Activation !== 'FILE') {
      command = command + ' -a ' + Activation;
    }
    if((Fixed_mod === 'C57' || Fixed_mod === 'C58') && fixedPTMFile) {
      let fixedPtmFileList: FileList | null = fixedPTMFile.files;
      if (fixedPtmFileList && fixedPtmFileList[0] === undefined) {
        command = command + ' -f ' + Fixed_mod;
      }
    }

    let N_terminal_form_list: string = '';
    if (N_terminal_form_option_0.is(":checked")) {
      N_terminal_form_list += 'NONE';
    }
    if (N_terminal_form_option_1.is(":checked")) {
      N_terminal_form_list += ',NME';
    }
    if (N_terminal_form_option_2.is(":checked")) {
      N_terminal_form_list += ',NME_ACETYLATION';
    }
    if (N_terminal_form_option_4.is(":checked")) {
      N_terminal_form_list += ',M_ACETYLATION';
    }
    command = command + ' -n ' + N_terminal_form_list;

    if (Decoy_option.is(":checked")) {
      command = command + ' -d';
      isDecoyGenerated = true;
    }

    if (Mass_error_tolerance !== '') {
      command = command + ' -e ' + Mass_error_tolerance;
    }

    if (Proteoform_error_tolerance !== '') {
      command = command + ' -p ' + Proteoform_error_tolerance;
    }

    if (Max_shift !== '') {
      command = command + ' -M ' + Max_shift;
    }

    if (Min_shift !== '') {
      command = command + ' -m ' + Min_shift;
    }

    if (Max_unexpected_mass_shift !== '') {
      command = command + ' -s ' + Max_unexpected_mass_shift;
    }

    if (Spectrum_cutoff_type !== '') {
      command = command  + ' -t ' + Spectrum_cutoff_type;
    }

    if (Spectrum_cutoff_value !== '') {
      command = command + ' -v ' + Spectrum_cutoff_value;
    }

    if (Proteoform_cutoff_type !== '') {
      command = command + ' -T ' + Proteoform_cutoff_type;
    }

    if (Proteoform_cutoff_value !== '') {
      command = command + ' -V '+ Proteoform_cutoff_value;
    }

    if (Lookup_table .is(":checked")) {
      command = command + ' -l';
    }

    if(Combined_spectra !== '') {
      command = command + ' -r ' + Combined_spectra;
    }

    if (Miscore_threshold !== '') {
      command = command + ' -H ' + Miscore_threshold;
    }

    if (No_TopFD_feature .is(":checked")) {
      command = command + ' -x';
    }

    if (Gene_mzid .is(":checked")) {
      isMzidGenerated = true;
    }
    //console.log("command", command);

    if (!isDecoyGenerated && Spectrum_cutoff_type == "FDR") {
      alert("Decoy database option should be checked if using FDR as spectum cutoff type!");
    } if (!isDecoyGenerated && Proteoform_cutoff_type == "FDR") {
      alert("Decoy database option should be checked if using FDR as proteoform cutoff type!");
    }

    let fastaFileList: FileList | null = fastaFile.files;
    if (!fastaFileList) {
      console.error("error generating fasta file list");
      return;
    }
    
    if (fixedPTMFile) {
      let fixedPtmFileList: FileList | null = fixedPTMFile.files;
      if (fixedPtmFileList) {
        if(fixedPtmFileList[0] !== undefined && !fixedPtmFileList[0].name.match(/.(txt)$/i)){
          alert('Please upload a txt file for fixed ptm file!');
          return;
        } 
      }
    }
    
    if (ptmShiftFile) {
      let ptmShiftFileList: FileList | null = ptmShiftFile.files;
      if (ptmShiftFileList) {
        if(ptmShiftFileList[0] !== undefined && !ptmShiftFileList[0].name.match(/.(txt)$/i)){
          alert('Please upload a txt file for shift ptm file!');
          return;
        } 
      }
    }

    if (fastaFileList[0] === undefined) {
      alert("Please choose a fasta database!");
    } else if(!fastaFileList[0].name.match(/.(fasta)$/i)){
      alert('Please upload a fasta file for protein database!');
    } else {
      var formData = new FormData();
      formData.append('fastaFile', fastaFileList[0]);
      // formData.append('lcmsFeatureFile', lcmsFeatureFile.files[0]);
      formData.append('fixedPTMFile', fixedPTMFile!.files![0]);//may be null, but it's ok
      formData.append('ptmShiftFile', ptmShiftFile!.files![0]);//may be null, but it's ok
      formData.append('projectCode', projectCode.value);
      formData.append('threadNum', threadNum.value);
      formData.append('command', command);
      formData.append('geneMzid', isMzidGenerated.toString());
      formData.append('decoyData', isDecoyGenerated.toString())
      //console.log(formData);
      xhr.onload = uploadSuccess.bind(null, xhr);
      xhr.upload.onprogress = setProgress.bind(null, progress);
      xhr.open('post', '/toppicTask', true);
      xhr.send(formData);
      }
    }
})();