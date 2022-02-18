$( document ).ready(function() {
  console.log( "ready!" );
  let publicValue: boolean = $('#publicValue').val() === 'true';
  let projectName: string | number | string[] | undefined = $('#projectName').val();
  let description: string | number | string[] | undefined = $('#description').val();

  if (projectName == undefined) {
    $('#project_Name').val('');
  } else {
    $('#project_Name').val(projectName);
  }
  if (description == undefined) {
    $('#project_Description').val('');
  } else {
    $('#project_Description').val(description);
  }
  $('#public').prop("checked", publicValue);

  $('#removeProject').click(function () {
    let result: boolean = confirm("Are you sure that you want to remove this project?");
        /*if (result) {
            $.ajax({
                url:"removeProject?projectCode=" + document.getElementById('projectCode').value,
                type: "post",
                success: function (res) {
                    alert('Your project has been removed.');
                    window.location.href = '/projects';
                }
            });
        }*/
    if (result) {
      let projectCode: HTMLInputElement | null = document.querySelector<HTMLInputElement>('projectCode');
      if (projectCode) {
        $.ajax({
            url:"checkProjectStatusSync?projectCode=" + projectCode.value,
            type: "post",
            success: function (res) {
              if (res !== 3) {//if it is not already removed
                $.ajax({
                  url:"removeProject?projectCode=" + projectCode!.value,
                  type: "post",
                  success: function (res) {
                    alert('Your project has been removed.');
                    window.location.href = '/projects';
                  }
                });
              } else {
                alert('ERROR: The project is already removed.');
                window.location.href = '/projects';
              }
            }
        });
      }
    }
  });

  $('#editButton').click(function () {
    let result: boolean = confirm("Are you sure that you want to edit this project?");
    let publicStatus: boolean = $('#public').prop("checked") === true;
    if (result) {
      let projectCode: HTMLInputElement | null = document.querySelector<HTMLInputElement>('projectCode');
      if (projectCode) {
        $.ajax({
          url:"editProject?projectCode=" + projectCode.value + "&projectName=" + $('#project_Name').val() + '&description=' + $('#project_Description').val() + "&publicStatus=" + publicStatus,
          type: "post",
          success: function (res) {
            alert('Your project has been edited.');
            window.location.href = '/projects';
          }
        });
      }
    }
  });
});