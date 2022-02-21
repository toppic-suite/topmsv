/*function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

if(getCookie('token')===''){
    alert('Please sign in to check your own projects!');
    window.location.href = '/';
} else {
    $('#signIn').text('Log out');
    $('#signIn').attr('href', '/logout');
}

// let pid = 0;
// let eid = 0;
// let datasetID = 0;

let type_g = 0;
let id_g = 0;

$.ajax({
    url:"test",
    type: "get",
    dataType: 'json',
    success: function (res) {
        $('#tree').treeview({
            data: res,
            levels: 1,
            onNodeSelected: function(event, node) {
                console.log("node href:", node.href.split('#'));
                $('#createExperiment').hide();
                $('#createDataset').hide();
                $('#datasetLink').hide();
                $('#deleteButton').hide();
                $('#editButton').hide();
                $('#passwordDiv').hide();
                let type = node.href.split('#')[0];
                let id = node.href.split('#')[1];
                type_g = type;
                id_g = id;
                $.ajax({
                    url:"getInfo?type="+type+"&id=" +id,
                    type:"get",
                    dataType: "json",
                    success: function (res) {
                        if (type === 'pid') {
                            $('#type').text("Project Information");
                            $('#name').text(res.projectName);
                            $('#description').text(res.description);
                            // console.log("public", res.public);
                            if(res.permission === 0) {
                                $('#permission').text("Public");
                            } else if (res.permission === 1) {
                                $('#permission').text("Private");
                            } else {
                                $('#permission').text("Password");
                                console.log(res.password);
                                if(res.password) {
                                    $('#password').text(res.password);
                                } else {
                                    $('#password').text("NULL");
                                }
                                $('#passwordDiv').show();
                            }
                            $('#deleteButton').show();
                        }
                        if (type === 'eid') {
                            $('#type').text("Experiment Information");
                            $('#name').text(res.ename);
                            $('#description').text(res.description);
                            $('#deleteButton').show();
                        }
                        if (type === 'datasetID') {
                            $('#type').text("Dataset Information");
                            $('#name').text(res.dname);
                            $('#description').text(res.description);
                            let link = '/data?id=' + res.projectCode;
                            // console.log(link);
                            $('#link').attr("href", link);
                            $('#datasetLink').show();
                            $('#deleteButton').show();
                        }
                        $('#editButton').show();
                        // console.log(res);
                        //$('#name').text(res);

                    }
                })
            },
        });
        $('#tree').treeview('selectNode', [0]);
    }
});

$('#createExperiment').click( function(){
    window.location.href = "/createExperiment?pid="+id_g;
})

$('#createDataset').click( function(){
    window.location.href = "/submit";
})

$('#deleteButton').click( function () {
    var result = confirm("Are you sure that you want to delete?");
    if(result) {
        $.ajax({
            url:"deleteRequest?type="+type_g+"&id=" +id_g,
            type:"post",
            success: function (res) {
                alert("Deleted successfully!");
                location.reload();
            }
        })
    }
})

$('#editButton').click(function () {
    window.location.href = "/editRequest?type=" + type_g + "&id=" +id_g;
})
*/
