(function () {
    'use strict';
    //console.log(projectCode.value);
    var upload = document.querySelector('#submitButton');
    var progress = document.querySelector('#progressbar');
    var xhr = new XMLHttpRequest();

    upload.addEventListener('click', uploadFile, false);

    // 点击上传
    function uploadFile(event) {
        //console.log("uploadFile");
        //console.log(ValidateEmail(email.value));
        var fastaFile = document.querySelector('#Protein_Database_Fasta');
        var fixedPTMFile = document.querySelector('#Fixed_PTMs');
        var ptmShiftFile = document.querySelector('#PTMs_Shifts');

        var projectCode = document.getElementById('projectCode');

        var Activation = $("#Activation").val();
        var Fixed_mod = $("#Fixed_mod").val();
        var N_terminal_form_option_0 = $('#N_terminal_form_option_0_');
        var N_terminal_form_option_1 = $('#N_terminal_form_option_1_');
        var N_terminal_form_option_2 = $('#N_terminal_form_option_2_');
        var N_terminal_form_option_4 = $('#N_terminal_form_option_3_');
        var Decoy_option = $('#Decoy_option');

        var Mass_error_tolerance = $('#Mass_error_tolerance').val();
        var Proteoform_error_tolerance = $('#Proteoform_error_tolerance').val();
        var Max_shift = $('#Max_shift').val();
        var Min_shift = $('#Min_shift').val();
        var Max_unexpected_mass_shift = $('#Max_unexpected_mass_shift').val();
        var Spectrum_cutoff_type = $('#Spectrum_cutoff_type').val();
        var Spectrum_cutoff_value = $('#Spectrum_cutoff_value').val();
        var Proteoform_cutoff_type = $('#Proteoform_cutoff_type').val();
        var Proteoform_cutoff_value = $('#Proteoform_cutoff_value').val();
        var Lookup_table = $('#Lookup_table');
        var Combined_spectra = $('#Combined_spectra').val();
        var Miscore_threshold = $('#Miscore_threshold').val();
        var No_TopFD_feature = $('#No_TopFD_feature');
        var Gene_mzid = $('#Gene_mzid');

        var threadNum = document.getElementById('threadNum');

        let isMzidGenerated = false;
        let isDecoyGenerated = false;

        let command = '';
        if (Activation !== '' && Activation !== 'FILE') {
            command = command + ' -a ' + Activation;
        }
        if((Fixed_mod === 'C57' || Fixed_mod === 'C58')&& fixedPTMFile.files[0] === undefined){
            command = command + ' -f ' + Fixed_mod;
        }

        let N_terminal_form_list = '';
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

        if(Combined_spectra !== ''){
            command = command + ' -r ' + Combined_spectra;
        }

        if (Miscore_threshold !== ''){
            command = command + ' -H ' + Miscore_threshold;

        }

        if (No_TopFD_feature .is(":checked")) {
            command = command + ' -x';
        }

        if (Gene_mzid .is(":checked")) {
            isMzidGenerated = true;
        }
        console.log("command", command);

        if (!isDecoyGenerated && Spectrum_cutoff_type == "FDR") {
            alert("Decoy database option should be checked if using FDR as spectum cutoff type!");
        }if (!isDecoyGenerated && Proteoform_cutoff_type == "FDR") {
            alert("Decoy database option should be checked if using FDR as proteoform cutoff type!");
        }

        if (fastaFile.files[0] === undefined) {
            alert("Please choose a fasta database!");
        }else if(!fastaFile.files[0].name.match(/.(fasta)$/i)){
            alert('Please upload a fasta file for protein database!');
        }else if(fixedPTMFile.files[0] !== undefined && !fixedPTMFile.files[0].name.match(/.(txt)$/i)){
            alert('Please upload a txt file for fixed ptm file!');
        }else if (ptmShiftFile.files[0] !== undefined && !ptmShiftFile.files[0].name.match(/.(txt)$/i)){
            alert("Please upload a txt file for shift ptm file!")
        }else {
            var formData = new FormData();
            formData.append('fastaFile', fastaFile.files[0]);
            // formData.append('lcmsFeatureFile', lcmsFeatureFile.files[0]);
            formData.append('fixedPTMFile', fixedPTMFile.files[0]);
            formData.append('ptmShiftFile', ptmShiftFile.files[0]);
            formData.append('projectCode', projectCode.value);
            formData.append('threadNum', threadNum.value);
            formData.append('command', command);
            formData.append('geneMzid', isMzidGenerated);
            formData.append('decoyData', isDecoyGenerated)
            console.log(formData);
            xhr.onload = uploadSuccess;
            xhr.upload.onprogress = setProgress;
            xhr.open('post', '/toppicTask', true);
            xhr.send(formData);
        }
    }

    // 成功上传
    function uploadSuccess(event) {
        if (xhr.readyState === 4) {
            setTimeout(function(){ if(!alert("Data uploaded successfully!\nPlease wait for processing!"))window.location.href ='/';}, 100)
        }
    }

    // 进度条
    function setProgress(event) {
        if (event.lengthComputable) {
            var complete = Number.parseInt(event.loaded / event.total * 100);
            progress.style.width = complete + '%';
            progress.innerHTML = complete + '%';
            if (complete == 100) {
                progress.innerHTML = 'Done!';
            }
        }
    }
})();