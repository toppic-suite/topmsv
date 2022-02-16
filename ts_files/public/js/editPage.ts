$( document ).ready(function() {
  console.log( "ready!" );
  let publicValue: boolean = $('#publicValue').val() === 'true';
  let name: string | number | string[] | undefined = $('#oriName').val();
  let description: string | number | string[] | undefined = $('#oriDescription').val();
  if (name == undefined) {
    $('#name').val('');
  } else {
    $('#name').val(name);
  }
  if (description == undefined) {
    $('#description').val('');
  } else {
    $('#description').val(description);
  }
  $('#public').prop("checked", publicValue);

  $('#editButton').click(function () {
    let result: boolean = confirm("Are you sure that you want to edit this project?");
    let publicStatus: boolean = $('#public').prop("checked") === true;
    if (result) {
      let type: HTMLInputElement | null = document.querySelector<HTMLInputElement>('type');
      if (type) {
        $.ajax({
          url:"editManage?type=" + type.value + "&id=" + $('#id').val() + '&name=' + $('#name').val()  + '&description=' + $('#description').val() + "&publicStatus=" + publicStatus,
          type: "post",
          success: function (res) {
            // alert('Your project has been edited.');
            window.location.href = '/projectTab';
          }
        });
      }
    }
  });
});