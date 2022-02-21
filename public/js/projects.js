"use strict";
if (getCookie('token') === '') {
    alert('Please sign in to check your own projects!');
    window.location.href = '/';
}
else {
    $('#signIn').text('Log out');
    $('#signIn').attr('href', '/logout');
}
