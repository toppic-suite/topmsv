/**
 * Sets all the fixed ptms to UI under Fixed Ptm column
 */
function setFixedPtmListToUI(commonFixedPtmList: Mod[]): void{
    let dropdown: HTMLElement = domElements.dropDownMenuLink;
    if (!dropdown){
        console.error("ERROR: dropdown element is empty");
        return;
    }
    commonFixedPtmList.forEach((fixedPtm) => {
        let value: string = fixedPtm.getResidue()+" : "+ fixedPtm.getShift().toString();
        let option: HTMLOptionElement = document.createElement("option");
        let dropdown = domElements.dropDownMenuLink;
        
        option.setAttribute("value",value);
        option.innerHTML = value;
        dropdown!.appendChild(option);//already checked for null
    })
    jqueryElements.addFixedPtmRow.click(() => {
        let fixedPtm: string = (<HTMLInputElement>dropdown!).value;//already checked for null
        if(fixedPtm !== "fixed_ptm")
        {
            addNewFixedPtmRow(fixedPtm);
        }
    })
}

/**
 * @function addNewFixedPtmRow
 * @description 
 * On Click of '+' symbol under fixed ptms in the HTML, creates new block to add Acid and mass shift
 * @param {String} fixedPtm - Contains Acid name and mass shift seperated by ':'
 */
function addNewFixedPtmRow(fixedPtm: string){
    let acid: string = '';
    let mass: string = '';
    let ifExist: boolean = false;
    if(fixedPtm !== "other")
    {
        let splitVal: string[] = fixedPtm.split(":");
        acid = splitVal[0].trim();
        mass = splitVal[1].trim();
        let existingPtmList: Mod[] = getFixedPtmCheckList();
        existingPtmList.forEach((element) => {
            //  && element.mass === parseFloat(mass)
            if (element.getResidue() === acid) {
                if (element.getShift().toString() == mass) {
                    ifExist = true;
                    return;
                }
                let replace: boolean = confirm("Fixed ptm is already applied for acid " + acid + ". Do you want to replace it?")         
                if (replace){
                   $(".fixedptms").each((i, div) => {
                       console.log(div)
                    //let acid: string = div.val().toUpperCase();
                    if (acid == element.getResidue()){
                        div.remove();
                    }
                });
                }else{
                    ifExist = true;
                }    
            }
        });
    }
    if (ifExist) return;
    let fixedPtmListDiv: HTMLElement = <HTMLElement>domElements.fixedPtmList;
    let fixedptmsdiv = document.createElement("div");
    fixedptmsdiv.setAttribute("class","fixedptms");
    
    //Creating div with input fixed acid and fixed mass 
    let inputAcid: HTMLInputElement = document.createElement("input");
    inputAcid.setAttribute("type","text");
    inputAcid.setAttribute("class","form-control fixedptmacid");
    // inputAcid.setAttribute("id","fixedptmacid");
    inputAcid.setAttribute("value",acid);
    
    let span: HTMLSpanElement = document.createElement("span");
    span.innerHTML = "&nbsp;:&nbsp;";
    
    let inputMass: HTMLInputElement = document.createElement("input");
    inputMass.setAttribute("type","text");
    inputMass.setAttribute("class","form-control fixedptmmass");
    // inputMass.setAttribute("id","fixedptmmass");
    inputMass.setAttribute("value",mass);
    
    let span2: HTMLSpanElement = document.createElement("span");
    span2.innerHTML = "&nbsp;";
    
    let addButton: HTMLButtonElement = document.createElement("button");
    addButton.setAttribute("type","button");
    addButton.setAttribute("class","form-control btn btn-default btn-sm addnewrow");
    
    let iAddFrame: HTMLElement = document.createElement("i");
    iAddFrame.setAttribute("class","fa fa-plus");
    
    addButton.appendChild(iAddFrame);
    
    let span3: HTMLSpanElement = document.createElement("span");
    span3.innerHTML = "&nbsp;";
    
    let removeButton: HTMLButtonElement = document.createElement("button");
    removeButton.setAttribute("type","button");
    removeButton.setAttribute("class","form-control btn btn-default btn-sm removerow");

    let iRemoveFrame: HTMLElement = document.createElement("i");
    iRemoveFrame.setAttribute("class","fa fa-times");
    removeButton.appendChild(iRemoveFrame);
    
    fixedptmsdiv.appendChild(inputAcid);
    fixedptmsdiv.appendChild(span);
    fixedptmsdiv.appendChild(inputMass);
    fixedptmsdiv.appendChild(span2);
    fixedptmsdiv.appendChild(removeButton);
    fixedPtmListDiv.appendChild(fixedptmsdiv);	
    
    $('.removerow').click((btn) => {
        console.log("btn", btn);
        /*let acid: string = btn.parent().find(".fixedptmacid").val();
        $(this).parent().remove();*/
        //temp code
        let errorVal: number;
        let errorType: any = jqueryElements.errorDropdown.val();
        if (typeof(errorType) == "string") {
            if(errorType === "masserror") {
                let val = jqueryElements.errorValue.val();
                if (typeof(val) == "string") {
                    errorVal = parseFloat(val.trim())
                }
            }
            else {
                let val = jqueryElements.errorValue.val();
                if (typeof(val) == "string") {
                    errorVal = parseFloat(val.trim());
                }
            }
        }
        // here
        // reload seqOfExecution to refresh result
        // let executionObj = new SeqOfExecution();
        // executionObj.sequenceOfExecution(errorType,errorVal,acid);
    })
}

/**
 * Set all the fixed masses on html
 */
function setFixedMasses(fixedPtmList: MassShift[]){
    if(fixedPtmList.length !=0)
    {
        // let commonfixedPtmList = [{name:"Carbamidomethylation",acid:"C",mass:57.021464},{name:"Carboxymethyl",acid:"C",mass:58.005479}];
        for(let i=0;i<fixedPtmList.length;i++)
        {
            for(let j=0; j<COMMON_FIXED_PTM_LIST.length;j++)
            {
                if(fixedPtmList[i].getAnnotation().toUpperCase() ===  COMMON_FIXED_PTM_LIST[j].getName().toUpperCase()){
                    let existingPtmList: Mod[] = getFixedPtmCheckList();
                    let isNewPtm: boolean = true;
                    if (existingPtmList.length > 0){//prevent same ptm added again
                        existingPtmList.forEach(ptm => {
                            if (ptm.getShift().toFixed(4) == fixedPtmList[i].getShift().toString()){
                                isNewPtm = false;
                            }  
                        })
                    }
                    if (isNewPtm){
                        let fixedptm: string = COMMON_FIXED_PTM_LIST[j].getResidue() + ":" + COMMON_FIXED_PTM_LIST[j].getShift.toString();
                        addNewFixedPtmRow(fixedptm);
                        break;    
                    }
                }
            }
        }
    } 
}

/**
 * @return {Array} FixedPtmList - return all the selected fixed ptms with acid and mass
 */
function getFixedPtmCheckList(): Mod[]
{
    let result: Mod[] = [];
    $(".fixedptms").each((i, div) => {
        //let acid: string = div.val().toUpperCase();
        //let mass: number = parseFloat(div.find('.fixedptmmass').val());
        //if(acid.length !== 0  && !isNaN(mass))
        //{
           // let tempfixedptm = new Mod(acid, mass, "");
           // result.push(tempfixedptm);
        //}
    });
    return result;
}