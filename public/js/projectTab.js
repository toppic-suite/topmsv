function getCookie(cname) {
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

let pid = 0;
let eid = 0;
let datasetID = 0;
$.ajax({
    url:"test",
    type: "get",
    dataType: 'json',
    success: function (res) {
        $('#tree').treeview({
            data: res,
            onNodeSelected: function(event, node) {
                console.log("node href:", node.href.split('#'));
                $('#createExperiment').hide();
                $('#createDataset').hide();
                let type = node.href.split('#')[0];
                let id = node.href.split('#')[1];
                $.ajax({
                    url:"getInfo?type="+type+"&id=" +id,
                    type:"get",
                    success: function (res) {
                        if (type === 'pid') {
                            pid = id;
                            $('#createExperiment').show();
                        }
                        if (type === 'eid') {
                            $('#createDataset').show();
                        }
                        console.log(res);
                        $('#name').text(res);

                    }
                })
            },
        });
    }
});

// $('#tree').on('nodeSelected', function(event, data) {
//     // Your logic goes here
//     console.log("node selected!");
//     console.log("event:", event);
//     console.log("data:", data);
// });

$('#createExperiment').click( function(){
    window.location.href = "/createExperiment?pid="+pid;
})

$('#createDataset').click( function(){
    window.location.href = "/submit";
})


