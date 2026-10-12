const apiurl = "https://jsonplaceholder.typicode.com";

let users = [];
let posts = [];
let comments = [];
let albums = [];
let todos = [];

let currentuserid = null;
let currentrequest = 0;
let currentalbumid = null;


// Start the application
$(document).ready(function () {
    getusers();

    // Static tab buttons: direct event handlers
    $("#posts-button").on("click", function () {
        activatetab("posts");
    });

    $("#albums-button").on("click", function () {
        currentalbumid = null;
        $("#photos-list").empty();
        $("#albums-list").removeClass("hidden");

        activatetab("albums");
    });

    $("#todos-button").on("click", function () {
        activatetab("todos");
    });

    // Dynamically created user buttons
    $(document).on("click", ".user-item", function () {
        handleuserclick($(this).attr("data-userid"));
    });

    // Dynamically created album buttons
    $(document).on("click", ".album-button", function () {
        handlealbumclick($(this).attr("data-albumid"));
    });

    // Dynamically created todo checkboxes
    $(document).on("change", ".todo-checkbox", function () {
        if (this.checked) {
            handletodoclick($(this).attr("data-todoid"));
        }
    });
});


// Fetch users
function getusers() {
    $("#message").text("Loading users...");

    $.getJSON(`${apiurl}/users`)
        .done(function (data) {
            users = data;

            renderusers();

            if (users.length > 0) {
                handleuserclick(users[0].id);
            } else {
                $("#message").text("No users found.");
            }
        })
        .fail(function () {
            $("#message").text("Unable to load users.");
        });
}


// Display users in the sidebar
function renderusers() {
    const userlist = $("#user-list");

    userlist.empty();

    users.forEach(user => {
        const button = $("<button>")
            .addClass("user-item")
            .attr("data-userid", user.id)
            .text(user.name);

        userlist.append(button);
    });
}


// Handle user selection
function handleuserclick(userid) {
    const user = users.find(item => item.id === Number(userid));

    if (!user) {
        return;
    }

    currentuserid = user.id;
    currentalbumid = null;

    const requestid = ++currentrequest;

    $("#user-list .user-item").removeClass("active");

    $(`#user-list .user-item[data-userid="${user.id}"]`)
        .addClass("active");

    $("#selected-username").text(user.name);
    $("#selected-email").text(user.email);
    $("#selected-userid").text(`User ID: ${user.id}`);

    clearcontent();

    $("#message").text("Loading user data...");

    // Fetch posts, albums, todos, and comments
    $.when(
        $.getJSON(`${apiurl}/posts?userId=${user.id}`),
        $.getJSON(`${apiurl}/albums?userId=${user.id}`),
        $.getJSON(`${apiurl}/todos?userId=${user.id}`),
        $.getJSON(`${apiurl}/comments`)
    )
        .done(function (postresult, albumresult, todoresult, commentresult) {
            if (requestid !== currentrequest) {
                return;
            }

            posts = postresult[0];
            albums = albumresult[0];
            todos = todoresult[0];
            comments = commentresult[0];

            renderposts();
            renderalbums();
            rendertodos();

            $("#message").text("");

            activatetab("posts");
        })
        .fail(function () {
            if (requestid === currentrequest) {
                $("#message").text("Unable to load user data.");
            }
        });
}


// Display posts and their comments
function renderposts() {
    const postslist = $("#posts-list");

    postslist.empty();

    if (posts.length === 0) {
        postslist.text("No posts found.");
        return;
    }

    posts.forEach(post => {
        const postcomments = comments.filter(
            comment => comment.postId === post.id
        );

        const card = $("<article>").addClass("post-card");

        const title = $("<h3>").text(post.title);

        const body = $("<p>")
            .addClass("post-body")
            .text(post.body);

        const commentssection = $("<div>")
            .addClass("comments-section");

        commentssection.append(
            $("<h4>").text(`Comments (${postcomments.length})`)
        );

        if (postcomments.length === 0) {
            commentssection.append(
                $("<p>").text("No comments found.")
            );
        }

        postcomments.forEach(comment => {
            const commentcard = $("<div>").addClass("comment");

            commentcard.append(
                $("<strong>").text(comment.name),
                $("<p>").text(comment.body)
            );

            commentssection.append(commentcard);
        });

        card.append(title, body, commentssection);

        postslist.append(card);
    });
}


// Display albums
function renderalbums() {
    const albumslist = $("#albums-list");

    albumslist.empty();
    $("#photos-list").empty();

    albumslist.removeClass("hidden");

    if (albums.length === 0) {
        albumslist.text("No albums found.");
        return;
    }

    albums.forEach(album => {
        const number = $("<span>")
            .addClass("album-number")
            .text(`Album ${album.id}`);

        const button = $("<button>")
            .addClass("album-button")
            .attr("data-albumid", album.id)
            .text(album.title);

        const card = $("<div>")
            .addClass("album-card")
            .append(number, button);

        albumslist.append(card);
    });
}


// Fetch photos for the selected album
function handlealbumclick(albumid) {
    currentalbumid = Number(albumid);

    const selectedalbumid = currentalbumid;
    const photoslist = $("#photos-list");

    $("#albums-list").addClass("hidden");

    photoslist.empty().text("Loading photos...");

    // This button is created dynamically, so attach its handler directly
    const backbutton = $("<button>")
        .addClass("back-button")
        .text("Back to albums")
        .on("click", function () {
            currentalbumid = null;

            photoslist.empty();
            $("#albums-list").removeClass("hidden");
        });

    $.getJSON(`${apiurl}/photos?albumId=${selectedalbumid}`)
        .done(function (photos) {
            // Ignore results if the user has moved away from this album
            if (currentalbumid !== selectedalbumid) {
                return;
            }

            photoslist.empty();
            photoslist.append(backbutton);

            const album = albums.find(
                item => item.id === selectedalbumid
            );

            if (album) {
                photoslist.append($("<h3>").text(album.title));
            }

            if (photos.length === 0) {
                photoslist.append(
                    $("<p>").text("No photos found.")
                );
                return;
            }

            const grid = $("<div>").addClass("photo-grid");

            photos.forEach(photo => {
                const image = $("<img>")
                    .attr("src", photo.thumbnailUrl)
                    .attr("alt", photo.title)
                    .attr("loading", "lazy");

                const title = $("<p>").text(photo.title);

                const card = $("<div>")
                    .addClass("photo-card")
                    .append(image, title);

                grid.append(card);
            });

            photoslist.append(grid);
        })
        .fail(function () {
            if (currentalbumid !== selectedalbumid) {
                return;
            }

            photoslist.empty();
            photoslist.append(
                backbutton,
                $("<p>").text("Unable to load photos.")
            );
        });
}


// Display only pending todos
function rendertodos() {
    const todoslist = $("#todos-list");

    todoslist.empty();

    const pendingtodos = todos.filter(todo => !todo.completed);

    if (pendingtodos.length === 0) {
        todoslist.text("No pending tasks.");
        return;
    }

    pendingtodos.forEach(todo => {
        const checkbox = $("<input>")
            .attr("type", "checkbox")
            .attr("data-todoid", todo.id)
            .addClass("todo-checkbox");

        const title = $("<span>")
            .addClass("todo-title")
            .text(todo.title);

        const card = $("<label>")
            .addClass("todo-card")
            .append(checkbox, title);

        todoslist.append(card);
    });
}


// Remove a checked todo from the pending list
function handletodoclick(todoid) {
    todos = todos.filter(todo => todo.id !== Number(todoid));

    rendertodos();
}


// Show the selected tab
function activatetab(tabname) {
    $(".tab-button").removeClass("active");

    $(`#${tabname}-button`).addClass("active");

    $(".tab-content").addClass("hidden");

    $(`#${tabname}-content`).removeClass("hidden");
}


// Clear old data when selecting another user
function clearcontent() {
    $("#posts-list").empty();
    $("#albums-list").empty();
    $("#photos-list").empty();
    $("#todos-list").empty();
}