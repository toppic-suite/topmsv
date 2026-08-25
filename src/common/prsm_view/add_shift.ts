//shared base for click-to-add a mass shift on a residue of a prsm sequence.
//It keeps the click state and shows the PTM selection pop-up; applying a
//shift is page-specific: the TopMSV viewer variant (toppic_view) implements
//the full inspect-page editing, while the spectra browser (topfd_view) keeps
//the default no-op.
class AddShiftBase {
  static appliedPtm: number[] = [];//variable PTM applied to the sequence so far
  static unknownMassShift: {"pos": number, "mass": number}[] = [];
  static clickedLetter: string = "";
  static clickedPos: number = -1;

  applyShift(ptmIdx: number, letter: string, pos: number): void {
    //overridden by the TopMSV viewer variant
  }

  handleOnClick(letter: string, pos: number): void{
    AddShiftBase.clickedLetter = letter;
    AddShiftBase.clickedPos = pos;

    let ptmDiv: HTMLElement | null = document.getElementById("tooltip-pop");
    if (ptmDiv != null) {
      $("#tooltip-pop").modal('show');
      ptmDiv.style.opacity = "1";

      $('#ptm-list').empty();
      $('#applied-ptm-list').empty();

      commonPtmList.forEach((ptm, idx) => {
        let entry: JQuery<HTMLLIElement> = $("<li></li>");
        entry.text(ptm.abbr + " (" + ptm.name + "); " + ptm.mass);
        entry.attr("id", "ptm" + idx);
        entry.attr("class", "text-center");
        entry.css("cursor", "pointer");
        entry.on("click", () => {this.applyShift(idx, letter, pos)});
        $("#ptm-list").append(entry);
      })

      AddShiftBase.appliedPtm.forEach((ptmIdx, idx) => {
        let entry: JQuery<HTMLLIElement> = $("<li></li>");
        entry.text(commonPtmList[ptmIdx].abbr + " (" + commonPtmList[ptmIdx].name + "); " + commonPtmList[ptmIdx].mass);
        entry.attr("id", "applied-ptm" + commonPtmList[ptmIdx].abbr);
        entry.attr("class", "text-center");
        entry.css("cursor", "pointer");
        entry.on("click", () => {this.applyShift(ptmIdx, letter, pos)});
        $("#applied-ptm-list").append(entry);
      })
    }
  }
}
