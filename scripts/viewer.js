this.auth = firebase.auth();
$('.fp-sign-out').click(function() {
  firebase.auth().signOut();
});
/***** Range Viewer Functions *****/
createNewViewer = function(title) {
  var user = this.auth.currentUser.uid;
  const groupingKey = firebase.database().ref('viewers').push().key;
  var update = {};
  update['viewers/' + groupingKey] = {
    author: {
      uid: this.auth.currentUser.uid,
      full_name: this.auth.currentUser.displayName,
      profile_picture: this.auth.currentUser.photoURL
    },
    admins: {
        [user]: true
    },
    title: title
  };
  update[`/people/${this.auth.currentUser.uid}/viewers/${groupingKey}`] = title;
    $('.viewerTitle').text(title);
    if(typeof window.rangeViewerId != 'undefined') {
        console.log(window.rangeViewerId + ' off');
        turnOffListeners(window.rangeViewerId);
    }

  firebase.database().ref().update(update).then(function() {
    realtimeListeners(groupingKey);
    return groupingKey;
  });
  return groupingKey;
}

saveSection = function(key, title) {
    var update = {};
    const tabKey = firebase.database().ref('viewers').push().key;
    update['/viewerNav/' + key + '/' + tabKey] = title;

    firebase.database().ref().update(update);

    return tabKey;
}

removePost = function(postId) {
    return firebase.database().ref(`viewerPosts/${window.rangeViewerId}/${window.viewerTab}/${postId}`).remove();
}

removeSection = function(sectionId) {
    var updates = {};
    updates[`viewerPosts/${window.rangeViewerId}/${sectionId}`] = null;
    updates[`viewerNav/${window.rangeViewerId}/${sectionId}/`] = null;
    return firebase.database().ref().update(updates);
}

turnOffListeners = function(viewerId) {
    var nav = firebase.database().ref('viewerNav/' + viewerId);
    nav.off();
    var posts = firebase.database().ref('viewerPosts/' + viewerId);
    posts.off();
}
realtimeListeners = function(viewerId) {

var navItems = firebase.database().ref('/viewerNav/' + viewerId);
navItems.on('child_added', function(data) {
    var key = data.key;
   var rangeTitle = data.val();
   var accordion = $('<div>', {class: 'mdl-accordion'});
   var groupTitle = $('<a>', {href: "#" + key, class: "mdl-navigation__link mdl-accordion__button rangeTitle"}).html('<i class="material-icons mdl-accordion__icon mdl-animation--default">expand_more</i>' + rangeTitle);
   var accordionContainer = $('<div>', {class: 'mdl-accordion__content-wrapper'});
   var accordionLinksContainer = $('<div>', {class: 'mdl-accordion__content mdl-animation--default'});

var buttons = firebase.database().ref('/viewerPosts/' + window.rangeViewerId + '/' + key);
buttons.on('child_added', function(data) {

//buttons.then(function(data) {
    var groupLinks = $('<a>', {id: data.key, 'data-title': rangeTitle, href: "#" + data.key, class: "postSelect mdl-navigation__link"}).text(data.val());
    componentHandler.upgradeDom(groupLinks);
    accordionLinksContainer.append(groupLinks);
    componentHandler.upgradeDom(accordionContainer);
    accordionLinksContainer.css('margin-top', -accordionLinksContainer.height());
    componentHandler.upgradeDom();
});

    buttons.on('child_removed', function(data) {
       $('#' + data.key).remove();
    });

    accordionContainer.append(accordionLinksContainer);
    componentHandler.upgradeDom(accordionContainer);
    accordion.append(accordionContainer);
    componentHandler.upgradeDom(accordion);
    accordion.prepend(groupTitle);
    componentHandler.upgradeDom(accordion);
    $('.range-nav').append(accordion);
    componentHandler.upgradeAllRegistered();
});

navItems.on('child_removed', function(data) {
    $('[href$="'+data.key+'"]').empty();
});

$('.mdl-menu__container').toggleClass('is-visible');
}

checkAdmin = function() {
    var adminStatus = firebase.database().ref(`/viewers/${window.rangeViewerId}/admins/${this.auth.currentUser.uid}`).once('value');

    adminStatus.then(function(data) {
        if(data.val()) {
            $('.edit').show();
        } else {
            $('.edit').hide();
        }


    });
}



        $('.edit').hide();
        $('#editViewer').hide();
        var filtersRef;
        var currentUser;
        var loadViewers = function() {
            $('#viewerSelect').empty();
            var viewers = firebase.database().ref('/people/' + currentUser.uid + '/viewers').once('value');

            //if(currentUser.isPro) {
            viewers.then(function(data) {
                $.each(data.val(), function(key, value) {
                  var element = $('<li>', {id: key, class: "selectViewer mdl-menu__item"}).text(value);
                 $('#viewerSelect').append(element);
                })
                componentHandler.upgradeDom();
            });

          /*} else {
            var element = $('<li>', {class: "mdl-menu__item"}).text('No Viewers Activated');
            $('#viewerSelect').append(element);
            console.log('Not Pro');
          //}*/
        }

$('#deleteViewer').click(function() {
    swal({
        title: 'Are you sure?',
        text: 'You will not be able to recover this viewer!',
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#DD6B55',
        confirmButtonText: 'Yes, delete it!',
        closeOnConfirm: false,
        showLoaderOnConfirm: true,
        allowEscapeKey: true
        }, function() {
        deleteViewer(window.rangeViewerId).then(function() {
            swal({
              title: 'Deleted!',
              text: 'Your post has been deleted.',
              type: 'success',
              timer: 2000
            });
            window.location.reload();
        }).catch(function(error) {
            swal.close();
              alert('There was an error deleting your viewer: ' + error);
            });
        });
});
        /** Build Viewer **/
        $('.mdl-layout__header-row').on('click', '#buildViewer', function() {
            $('#viewerTitle').show();
        });

        $('#saveViewerTitle').click(function() {
            var title = $('#vtitleInput').val();

            if (title != '' && typeof title != 'undefined') {
                window.rangeViewerId = createNewViewer(title);
                checkAdmin();
                $('.filters').empty();
                $('.range-nav').empty();
                $('#viewerTitle').hide();
                loadViewers();
            } else {
                swal({
                  title: 'No Title',
                  text: 'Please enter a viewer title',
                  type: 'error',
                  timer: 2000
                });
            }
        });

        $('#cancelViewer').click(function() {
            $('#viewerTitle').hide();
        });

        $('#addSection').click(function() {
            $('#sectionNameForm').show();
        });

        $('#saveGrouping').click(function() {
            if ($('#groupingInput').val() != '') {
               window.viewerTab = saveSection(window.rangeViewerId, $('#groupingInput').val());
               $('#sectionNameForm').hide();
            } else {
                swal({
                  title: 'Please Add Title',
                  text: 'Title Cannot Be Blank',
                  type: 'error',
                  timer: 2000
                });
            }
        });

        $('#cancelGrouping').click(function() {
           $('#sectionNameForm').hide();
        });

        $('#addPosts').click(function() {
        if (window.viewerTab != null) {
            displaySearchResults();
            $('#selectPostsForm').show();
        } else {
            swal({
              title: 'No Tab Selected',
              text: 'Must select a tab to add posts to',
              type: 'error',
              timer: 2000
            });
        }

        });

        /** ADD POSTS **/
        FilterSearchResults = function(searchTerm) {
            if (searchTerm.length > 2) {
                $('.postList').each(function() {
                   var postValue = String($(this).data('id'));
                   postValue = postValue.toLowerCase();
                   if (postValue.indexOf(searchTerm) < 0) {
                       $(this).hide();
                   }
                });
            } else {
                $('.postList').show();
            }
        }
        addPostToViewer = function(viewerId, TabId, BtnId, BtnName) {
            var updates = {};
            updates['/viewerPosts/' + viewerId + '/' + TabId +'/' + BtnId] = BtnName;
            firebase.database().ref().update(updates);
        }

        addPostsToGroup = function() {
            $('input:checkbox:checked').each(function() {
                addPostToViewer(window.rangeViewerId, window.viewerTab, $(this).attr('id'), $(this).data('value'));
                var button = document.createElement('button');
                button.classList.add('mdl-button');
                button.classList.add('mdl-js-button');
                button.classList.add('mdl-button-small');
                button.classList.add('viewerPostButtons');
                button.innerHTML = $(this).data('value');

                componentHandler.upgradeElement(button);
                $('.activeTab').append(button);
            });

            $('#selectPostsForm').hide();
        }
        $('#cancelSearchPosts').click(function() {
           $('#selectPostsForm').hide();
        });

        $('#searchPosts').keyup(function() {
               FilterSearchResults($(this).val());
        });

        $('#doneAddingPosts').click(function() {
           addPostsToGroup();
            $('#selectPostsForm').hide();
            updatePanel(window.rangeViewerId, window.viewerTab);
        });

        /** Manage Members **/
        $('#addMembers').click(function() {
            $('#manageMembersForm').show();
            displayMembers();
        });

        $('#cancelManageMembers').click(function() {
           $('#searchMembers').val('');
            $('#manageMembersForm').hide();
        });

        $('#doneManagingMembers').click(function() {
           $('#manageMembersForm').hide();
        });

        $('#searchMembers').keyup(function() {
           displayMemberResults($(this), $('.membersList'));
        });

        $('.membersList').on('click', '.selectMember', function() {

           var updates = {};
           updates[`people/${$(this).data('id')}/viewers/${window.rangeViewerId}`] = $('.viewerTitle').text();
           updates[`viewers/${window.rangeViewerId}/members/${$(this).data('id')}`] = $(this).data('name');
           firebase.database().ref().update(updates).then(function() {
              $('#searchMembers').val('');
           });
        });

        $('.membersList').on('click', '.removeMember', function() {
           var userId = $(this).data('id');
           var updates = {};
           updates[`/viewers/${window.rangeViewerId}/members/${userId}`] = null;
            updates[`people/${userId}/viewers/${window.rangeViewerId}`] = null;
           firebase.database().ref().update(updates);
           $(this).parent('li').remove();
        });

      searchUsers = function(searchString, maxResults) {
        searchString = latinize(searchString).toLowerCase();
        const query = firebase.database().ref('/people')
            .orderByChild('_search_index/full_name').startAt(searchString)
            .limitToFirst(maxResults).once('value');
        const reversedQuery = firebase.database().ref('/people')
            .orderByChild('_search_index/reversed_full_name').startAt(searchString)
            .limitToFirst(maxResults).once('value');
        return Promise.all([query, reversedQuery]).then(results => {
          const people = {};
          // construct people from the two search queries results.
          results.forEach(result => result.forEach(data => {
            people[data.key] = data.val();
          }));

          // Remove results that do not start with the search query.
          const userIds = Object.keys(people);
          userIds.forEach(userId => {
            const name = people[userId]._search_index.full_name;
            const reversedName = people[userId]._search_index.reversed_full_name;
            if (!name.startsWith(searchString) && !reversedName.startsWith(searchString)) {
              delete people[userId];
            }
          });
          return people;
        });
      }

    displayMemberResults = function(searchField, searchResults) {
        const searchString = searchField.val().toLowerCase().trim();
        if (searchString.length >= 3) {
          searchUsers(searchString, 3).then(
              results => {
                searchResults.empty();
                const peopleIds = Object.keys(results);
                if (peopleIds.length > 0) {
                  searchResults.fadeIn();
                  $('html').click(() => {
                    $('html').unbind('click');
                    searchResults.fadeOut();
                  });
                  peopleIds.forEach(peopleId => {
                    const profile = results[peopleId];
                    searchResults.append(
                        createMemberSearchResultHtml(peopleId, profile));
                  });
                } else {
                  searchResults.fadeOut();
                }
              });
        } else {
          searchResults.empty();
          searchResults.fadeOut();
        }
      }

      /**
       * Returns the HTML for a single search result
       */
      createMemberSearchResultHtml = function(peopleId, peopleProfile) {

        return `
            <a data-id="${peopleId}" data-name="${peopleProfile.full_name} "class="selectMember fp-searchResultItem fp-usernamelink mdl-button mdl-js-button">
                <div class="fp-avatar" style="background-image: url(${peopleProfile.profile_picture ||
                    '/images/silhouette.jpg'})"></div>
                <div class="fp-username mdl-color-text--black">${peopleProfile.full_name} - ${peopleId}</div>
            </a>`;
      }

        displayMembers = function() {
              var result = firebase.database().ref('/viewers/'+window.rangeViewerId+'/members').once('value');
              const postResults = {};

              result.then(function(data) {
                  $('.membersList').empty();
                  var posts = data.val();

                  $.each(data.val(), function(key, value) {
                        postResults[key] = value;
                  var listItem = $('<li>', {'class': 'memberList mdl-list__item', 'data-id': value});
                  listItem.html('<span class="mdl-list__item-primary-content">' + value + '</span><a class="mdl-list__item-secondary-action removeMember" href="#" data-id="'+key+'"><i class="material-icons">delete</i></a>');

                  $('.membersList').append(listItem);

                  });

                  componentHandler.upgradeDom();

              });
        }


        displaySearchResults = function() {
              var result = firebase.database().ref('/people/'+this.auth.currentUser.uid+'/posts').limitToFirst(100).once('value');
              const postResults = {};

              result.then(function(data) {
                  $('.viewerPostsList').empty();
                  var posts = data.val();

                  $.each(data.val(), function(key, value) {
                        postResults[key] = value;
                  var listItem = $('<li>', {'class': 'postList mdl-list__item', 'data-id': value});
                  listItem.html('<span class="mdl-list__item-primary-content">' + value + '</span><span class="mdl-list__item-secondary-action"><label class="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect" for="' + key + '"><input type="checkbox" data-value ="' + value + '" id="' + key + '" class="mdl-checkbox__input" autocomplete="false"/></label>');

                  $('.viewerPostsList').append(listItem);

                  });

                  componentHandler.upgradeDom();
                  $('#selectPostsForm').show();

              });
        }

        /** Edit Viewer **/
        $('#editViewer').click(function() {
           $('.viewerTitle').attr('contenteditable', true);
           $('.edit').show();
        });

        /** Save Viewer **/
        $('.saveViewer').click(function() {
           firebase.database().ref('/viewers/' + window.rangeViewerId).update({
               title: $('.viewerTitle').text()
           });
           $('.viewerTitle').attr('contenteditable', false);
           $('.edit').hide();
        });

var percentBreakDown = function(selector, total, color, weighted) {
      var combos = ($(selector + '.s').length * 4) + ($(selector + '.o').length * 12) + ($(selector + '.p').length * 6);
          var id = selector;
          id = id.replace('.', '');
      var breakdown;
      if ((combos+weighted) > 0) {
       var totalCombos = parseInt(combos) + parseInt(weighted);
       breakdown = ((combos + weighted) / total) * 100;
       $(selector + ' .sectionCombos').html(breakdown.toFixed(2) + '% (' + totalCombos.toFixed(2) + ' combos)');
      } else {
          $('.mdl-list__item.' + id).hide();
        breakdown = 0;
      }
      //$('div[data-mdl-for="' + id + '"]').html(breakdown.toFixed(2) + '% (' + combos + ')');
      /*$('.combosBreakdown').append('<li class="mdl-list__item ' + color + '">' + breakdown.toFixed(2) + '% (' + combos + ')</li>');*/
  }

var countWeightedCombos = function() {
      var weightedSuits = $('.s').children();
      var weightedOff = $('.o').children();
      var weightedPP = $('.p').children();

      var categories = {};
        categories.total=0;
        categories.category1=0;
        categories.category2 = 0;
        categories.category3 = 0;
        categories.category4 = 0;
        categories.category5 = 0;
        categories.category6 = 0;
        categories.category7 = 0;
        categories.category8 = 0;
        categories.category9 = 0;
        categories.category10 = 0;
        categories.category11 = 0;
        categories.category12 = 0;
        categories.category13 = 0;
        categories.category14 = 0;
        categories.category15 = 0;
        categories.category16 = 0;

      weightedSuits.each(function(index, element) {
          categories.total += (4 * ($(element).attr('data-weight')/100));
          if ($(element).hasClass('mdl-color--green')) {
            categories.category1 += (4 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--amber')) {
            categories.category2 += (4 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--red')) {
            categories.category3 += (4 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--blue')) {
            categories.category4 += (4 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--lime')) {
            categories.category5 += (4 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--cyan')) {
            categories.category6 += (4 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--brown')) {
            categories.category7 += (4 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--grey')) {
            categories.category8 += (4 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--teal')) {
            categories.category9 += (4 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--indigo')) {
            categories.category10 += (4 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--purple')) {
            categories.category11 += (4 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--pink')) {
            categories.category12 += (4 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--light-green')) {
            categories.category13 += (4 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--orange')) {
            categories.category14 += (4 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--deep-orange')) {
            categories.category15 += (4 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--deep-purple')) {
            categories.category16 += (4 * ($(element).attr('data-weight') / 100));
          }
      });

      weightedOff.each(function(index, element) {
          categories.total += (12 * ($(element).attr('data-weight')/100));
          if ($(element).hasClass('mdl-color--green')) {
            categories.category1 += (12 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--amber')) {
            categories.category2 += (12 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--red')) {
            categories.category3 += (12 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--blue')) {
            categories.category4 += (12 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--lime')) {
            categories.category5 += (12 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--cyan')) {
            categories.category6 += (12 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--brown')) {
            categories.category7 += (12 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--grey')) {
            categories.category8 += (12 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--teal')) {
            categories.category9 += (12 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--indigo')) {
            categories.category10 += (12 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--purple')) {
            categories.category11 += (12 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--pink')) {
            categories.category12 += (12 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--light-green')) {
            categories.category13 += (12 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--orange')) {
            categories.category14 += (12 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--deep-orange')) {
            categories.category15 += (12 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--deep-purple')) {
            categories.category16 += (12 * ($(element).attr('data-weight') / 100));
          }

      });

      weightedPP.each(function(index, element) {
          categories.total += (6 * ($(element).attr('data-weight')/100));
          if ($(element).hasClass('mdl-color--green')) {
            categories.category1 += (6 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--amber')) {
            categories.category2 += (6 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--red')) {
            categories.category3 += (6 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--blue')) {
            categories.category4 += (6 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--lime')) {
            categories.category5 += (6 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--cyan')) {
            categories.category6 += (6 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--brown')) {
            categories.category7 += (6 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--grey')) {
            categories.category8 += (6 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--teal')) {
            categories.category9 += (6 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--indigo')) {
            categories.category10 += (6 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--purple')) {
            categories.category11 += (6 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--pink')) {
            categories.category12 += (6 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--light-green')) {
            categories.category13 += (6 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--orange')) {
            categories.category14 += (6 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--deep-orange')) {
            categories.category15 += (6 * ($(element).attr('data-weight') / 100));
          }
          if ($(element).hasClass('mdl-color--deep-purple')) {
            categories.category16 += (6 * ($(element).attr('data-weight') / 100));
          }
      });

      return categories;
  }

  var updatePercent = function() {

      var suited = ($('.mdl-color--green.s').length +  $('.mdl-color--amber.s').length + $('.mdl-color--red.s').length + $('.mdl-color--blue.s').length + $('.mdl-color--lime.s').length + $('.mdl-color--cyan.s').length + $('.mdl-color--brown.s').length + $('.mdl-color--grey.s').length + $('.mdl-color--teal.s').length + $('.mdl-color--indigo.s').length + $('.mdl-color--purple.s').length +  $('.mdl-color--pink.s').length + $('.mdl-color--light-green.s').length + $('.mdl-color--orange.s').length + $('.mdl-color--deep-orange.s').length + $('.mdl-color--deep-purple.s').length) * 4 ;

      var offsuit = ($('.mdl-color--green.o').length +  $('.mdl-color--amber.o').length + $('.mdl-color--red.o').length + $('.mdl-color--blue.o').length + $('.mdl-color--lime.o').length + $('.mdl-color--cyan.o').length + $('.mdl-color--brown.o').length + $('.mdl-color--grey.o').length + $('.mdl-color--teal.o').length + $('.mdl-color--indigo.o').length + $('.mdl-color--purple.o').length +  $('.mdl-color--pink.o').length + $('.mdl-color--light-green.o').length + $('.mdl-color--orange.o').length + $('.mdl-color--deep-orange.o').length + $('.mdl-color--deep-purple.o').length) * 12;

      var pp = ($('.mdl-color--green.p').length +  $('.mdl-color--amber.p').length + $('.mdl-color--red.p').length + $('.mdl-color--blue.p').length + $('.mdl-color--lime.p').length + $('.mdl-color--cyan.p').length + $('.mdl-color--brown.p').length + $('.mdl-color--grey.p').length + $('.mdl-color--teal.p').length + $('.mdl-color--indigo.p').length + $('.mdl-color--purple.p').length +  $('.mdl-color--pink.p').length + $('.mdl-color--light-green.p').length + $('.mdl-color--orange.p').length + $('.mdl-color--deep-orange.p').length + $('.mdl-color--deep-purple.p').length) * 6;
      console.log(offsuit);
      console.log(suited);
      console.log(pp);

      var weightedCombos = countWeightedCombos();
      console.log('weighted ' + weightedCombos.total);

      var totalSelected = (suited + offsuit + pp + weightedCombos.total);
      var percentSelected = ( totalSelected / 1326) * 100;
      $('.selectedItems').text(percentSelected.toFixed(1) + "% of hands");
      $('.totalCombos').text('('+ totalSelected.toFixed(2) +') combos')

      percentBreakDown('.mdl-color--green', totalSelected, 'mdl-color--green text-white', weightedCombos.category1);
      percentBreakDown('.mdl-color--amber', totalSelected, 'mdl-color--amber text-white', weightedCombos.category2);
      percentBreakDown('.mdl-color--red', totalSelected, 'mdl-color--red text-white', weightedCombos.category3);
      percentBreakDown('.mdl-color--blue', totalSelected, 'mdl-color--blue text-white', weightedCombos.category4);
      percentBreakDown('.mdl-color--lime', totalSelected, 'mdl-color--lime text-white', weightedCombos.category5);
      percentBreakDown('.mdl-color--cyan', totalSelected, 'mdl-color--cyan text-white', weightedCombos.category6);
      percentBreakDown('.mdl-color--brown', totalSelected, 'mdl-color--brown text-white', weightedCombos.category7);
      percentBreakDown('.mdl-color--grey', totalSelected, 'mdl-color--grey text-white', weightedCombos.category8);
      percentBreakDown('.mdl-color--teal', totalSelected, 'mdl-color--teal text-white', weightedCombos.category9);
      percentBreakDown('.mdl-color--indigo', totalSelected, 'mdl-color--indigo text-white', weightedCombos.category10);
      percentBreakDown('.mdl-color--purple', totalSelected, 'mdl-color--purple text-white', weightedCombos.category11);
      percentBreakDown('.mdl-color--pink', totalSelected, 'mdl-color--pink text-white', weightedCombos.category12);
      percentBreakDown('.mdl-color--light-green', totalSelected, 'mdl-color--light-green text-white', weightedCombos.category13);
      percentBreakDown('.mdl-color--orange', totalSelected, 'mdl-color--orange text-white', weightedCombos.category14);
      percentBreakDown('.mdl-color--deep-orange', totalSelected, 'mdl-color--deep-orange text-white', weightedCombos.category15);
      percentBreakDown('.mdl-color--deep-purple', totalSelected, 'mdl-color--deep-purple text-white', weightedCombos.category16);

  }
        var createPanel = function(viewerId, navId) {
            var panel = $('.panel-tabs');
            var buttons = firebase.database().ref('/viewerPosts/' + currentUser.uid + '/' + viewerId + '/' + navId).once('value');

            buttons.then(function(data) {
                $.each(data.val(), function(key, value) {
                var postBtn = $('<a>', {id: key, href: "#" + key, class: "mdl-tabs__tab"}).text(value);
                componentHandler.upgradeDom(postBtn);
                panel.append(postBtn);
                });
            });
        }

        var updatePanel = function(viewerId, navId) {
            $('#' + navId).empty();
            var buttons = firebase.database().ref('/viewerPosts/' + viewerId + '/' + navId).once('value');
            buttons.then(function(data) {
                $.each(data.val(), function(key, value) {
                var postBtn = $('<button>', {id: key, class: "postSelect mdl-button mdl-js-button mdl-button--small"}).text(value);
                componentHandler.upgradeDom(postBtn);
                $('#' + navId).append(postBtn);
                });
            });
        }

        var deleteViewer = function(id) {
            var viewers = {};
            viewers['/viewers/' + id] = null;
            viewers['/viewerNav/' + id] = null;
            viewers['/viewerPosts/' + id] = null;
            viewers[`/people/${currentUser.uid}/viewers/${id}`] = null;
            return firebase.database().ref().update(viewers);
        }

$(document).ready(function() {
     $('.colorSelect').hover(function() {
       var selector = $(this).attr('id');
        $('.cell').stop();
        $('.cell').animate({
           opacity: 0.25
        }, 300, function() {
            $('.cell.' + selector).css('opacity', 1);
            $('.weighted.'+selector).css('opacity', 1);
            $('.weighted.'+selector).parent().css('opacity', 1);
        });
    }, function() {
        $('.cell').animate({opacity: 1}, 300);
    });

    $('.colorSelect').mouseout(function() {
      $('.cell').finish();
    });


    $('.mdl-navigation').on('click', '.mdl-accordion__button', function(){
      $('.mdl-accordion').removeClass('mdl-accordion--opened');
      $(this).parent('.mdl-accordion').toggleClass('mdl-accordion--opened');

      window.viewerTab = $(this).attr('href').replace('#', '');
    });

    $('.mdl-navigation').on('dblclick', '.mdl-accordion__button', function(){
            swal({
              title: 'Are you sure?',
              text: 'This will remove this section from the viewer',
              type: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#DD6B55',
              confirmButtonText: 'Yes, remove it!',
              closeOnConfirm: false,
              showLoaderOnConfirm: true,
              allowEscapeKey: true
            }, () => {
              var sectionId = $(this).attr('href').replace('#', '');
              removeSection(sectionId).then(() => {
                swal({
                  title: 'Removed!',
                  text: 'Section has been removed.',
                  type: 'success',
                  timer: 2000
                });

                $(this).remove();
                clearGrid();
                $('.filters').empty();
              }).catch(error => {
                swal.close();
                const data = {
                  message: `There was an error removing your post: ${error}`,
                  timeout: 3000
                };
                this.toast[0].MaterialSnackbar.showSnackbar(data);
              });
            });
    });

        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
              $('#page-splash').hide();
                currentUser = user;
                /***** Display UserName *****/
                $('.userEmail').html(currentUser.email);
                $('.userNames').html(currentUser.displayName + ' - ' + currentUser.uid);
                ranger.firebase.saveUserData(user.providerData[0].photoURL || '/images/silhouette.jpg', user.displayName);
                var role = ranger.MaterialUtils.checkRole();
                loadViewers();
                role.then(function(data) {
                    if(data === true) {
                      firebase.auth().currentUser.isPro = true;
                      console.log(currentUser.isPro);
                      //loadViewers();
                      var html = `<button id="buildViewer" class="mdl-button mdl-js-button mdl-button--icon mdl-js-ripple-effect" style="display">
                        <i class="material-icons">add</i>
                          <div class="mdl-tooltip mdl-tooltip" for="buildViewer">New Viewer</div>
                      </button>`;

                      $('.mdl-layout__header-row').append(html);
                    } else {
                        firebase.auth().currentUser.isPro = false;
                        console.log(currentUser.isPro);
                        //loadViewers();
                        console.log('Free Version');
                    }
                  });
            } else {
                firebaseUi.start('#firebaseui-auth-container', uiConfig);
                $('.mdl-layout').hide();
                $('#page-splash').show();
            }
        });

        $('#viewerSelect').on('click', '.selectViewer', function() {
            turnOffListeners(window.rangeViewerId);
            realtimeListeners($(this).attr('id'));
            window.rangeViewerId = $(this).attr('id');
            $('.deleteViewer').show();
            checkAdmin();
            $('.range-nav').empty();
            $('.viewerTitle').html($(this).text());

        });

        var clearGrid = function() {
        $('#fullTable td').removeClass('mdl-color--green mdl-color--amber mdl-color--red mdl-color--blue mdl-color--lime mdl-color--cyan mdl-color--brown mdl-color--grey mdl-color--teal mdl-color--indigo mdl-color--purple mdl-color--pink mdl-color--light-green mdl-color--orange mdl-color--deep-orange mdl-color--deep-purple');

            $('.colorSelect').each(function() {
                $(this).text('');
            });

            $('.weighted').remove();

        }

        $('.range-nav').on('click', '.tabBtn', function() {
           clearGrid();
           $('.mdl-tabs__panel').hide();
            $('.filters').empty();
            showTab = $(this).attr('href');
            window.viewerTab = showTab.replace(/[#]/g, '');
            $(showTab).show();
            $('.mdl-navigation__link').removeClass('is-active');
            $(this).addClass('is-active');
        });

        $('.range-nav').on('click', '.postSelect', function() {
           window.postKey = $(this).attr('id');
            var title = $(this).attr('data-title');
            $('#selectedGroupTitle').html(title + ' - ' + $(this).text());
            clearGrid();
            if ($('.mdl-layout').hasClass('is-small-screen')) {
                var d = document.querySelector('.mdl-layout');
                d.MaterialLayout.toggleDrawer();
            }
            filtersRef = firebase.database().ref('/filters/'+window.postKey);
            filtersRef.once('value').then(function(data) {
           $('.filters').empty();
                $.each(data.val(), function(key, value) {
                    if(data.val()[key].name) {
                        var html = '<button id="'+key+'" class="filterbtns mdl-button mdl-js-button mdl-button--raised mdl-button--accent mdl-button mdl-button-small">'+data.val()[key].name+'</button>';
                        $('.filters').append(html);
                    }
                })

            });


        });

        $('.range-nav').on('dblclick', '.postSelect', function() {
            swal({
              title: 'Are you sure?',
              text: 'This will remove this post from the viewer',
              type: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#DD6B55',
              confirmButtonText: 'Yes, remove it!',
              closeOnConfirm: false,
              showLoaderOnConfirm: true,
              allowEscapeKey: true
            }, () => {
              var postId = $(this).attr('id');
              removePost(postId).then(() => {
                swal({
                  title: 'Removed!',
                  text: 'Your post has been removed.',
                  type: 'success',
                  timer: 2000
                });

                $(this).remove();
                clearGrid();
                $('.filters').empty();
              }).catch(error => {
                swal.close();
                const data = {
                  message: `There was an error removing your post: ${error}`,
                  timeout: 3000
                };
                this.toast[0].MaterialSnackbar.showSnackbar(data);
              });
            });
        });

    var setButtons = function(button, value) {
        $('#' + button).html('<span class="title">'+ value + '</span><div class="sectionCombos"></div>');
        $('.mdl-list__item.' + button).show();
    };
    var hideButtons = function(button) {
        var element = $('.mdl-list__item.' + button);
        $('.mdl-list__item.' + button).hide();
    }

$('.filters').on('click', '.filterbtns', function() {
            $('.filters .selectedFilter').removeClass('selectedFilter');
            $(this).addClass('selectedFilter');
            clearGrid();
$('.rangeBreakdown').show();


    firebase.database().ref('/ranges/'+window.postKey+'/'+$(this).attr('id')).once('value', function(data) {
        if (data.val() != null) {
        if (data.val().category1) {
               data.val().category1.forEach(function(hand) {
                   if(hand.indexOf(':') >=0) {
                       var reg = /(.*?):(.*)/;
                       var m = hand.match(reg);
                       var m1 = m[1];
                       var m2 = m[2];
                      var weightedDiv = $('<div>');
                      weightedDiv.addClass('mdl-color--green weighted');
                      weightedDiv.attr('data-weight', m2);
                      weightedDiv.attr('data-hand', m1);
                      weightedDiv.width(m2 + '%');

                      var start = 0;
                      $('#cid_' + m1).children('.weighted').each(function() {
                          start+= parseInt(this.getAttribute('data-weight'));
                      });
                       if (start < 1) {
                           start = 0;
                       } else {
                            start = start + '%';
                       }
                      weightedDiv.css('left', start);
                      $('#cid_' + m1).prepend(weightedDiv);
                   } else {
                    $('#cid_' + hand).addClass('mdl-color--green');
                   }
               });
        }
        if (data.val().category2) {
               data.val().category2.forEach(function(hand) {
                   if(hand.indexOf(':') >=0) {
                       var reg = /(.*?):(.*)/;
                       var m = hand.match(reg);
                       var m1 = m[1];
                       var m2 = m[2];
                      var weightedDiv = $('<div>');
                      weightedDiv.addClass('mdl-color--amber weighted');
                      weightedDiv.attr('data-weight', m2);
                      weightedDiv.attr('data-hand', m1);
                      weightedDiv.width(m2 + '%');

                      var start = 0;
                      $('#cid_' + m1).children('.weighted').each(function() {
                          start+= parseInt(this.getAttribute('data-weight'));
                      });
                       if (start < 1) {
                           start = 0;
                       } else {
                            start = start + '%';
                       }
                      weightedDiv.css('left', start);
                      $('#cid_' + m1).prepend(weightedDiv);
                   } else {
                   $('#cid_' + hand).addClass('mdl-color--amber');
                   }
               });
        }
        if (data.val().category3) {
               data.val().category3.forEach(function(hand) {
                   if(hand.indexOf(':') >=0) {
                       var reg = /(.*?):(.*)/;
                       var m = hand.match(reg);
                       var m1 = m[1];
                       var m2 = m[2];
                      var weightedDiv = $('<div>');
                      weightedDiv.addClass('mdl-color--red weighted');
                      weightedDiv.attr('data-weight', m2);
                      weightedDiv.attr('data-hand', m1);
                      weightedDiv.width(m2 + '%');

                      var start = 0;
                      $('#cid_' + m1).children('.weighted').each(function() {
                          start+= parseInt(this.getAttribute('data-weight'));
                      });
                       if (start < 1) {
                           start = 0;
                       } else {
                            start = start + '%';
                       }
                      weightedDiv.css('left', start);
                      $('#cid_' + m1).prepend(weightedDiv);
                   } else {
                   $('#cid_' + hand).addClass('mdl-color--red');
                   }
               });
        }
        if (data.val().category4) {
               data.val().category4.forEach(function(hand) {
                   if(hand.indexOf(':') >=0) {
                       var reg = /(.*?):(.*)/;
                       var m = hand.match(reg);
                       var m1 = m[1];
                       var m2 = m[2];
                      var weightedDiv = $('<div>');
                      weightedDiv.addClass('mdl-color--blue weighted');
                      weightedDiv.attr('data-weight', m2);
                      weightedDiv.attr('data-hand', m1);
                      weightedDiv.width(m2 + '%');

                      var start = 0;
                      $('#cid_' + m1).children('.weighted').each(function() {
                          start+= parseInt(this.getAttribute('data-weight'));
                      });
                       if (start < 1) {
                           start = 0;
                       } else {
                            start = start + '%';
                       }
                      weightedDiv.css('left', start);
                      $('#cid_' + m1).prepend(weightedDiv);
                   } else {
                   $('#cid_' + hand).addClass('mdl-color--blue');
                   }
               });
        }
        if (data.val().category5) {
               data.val().category5.forEach(function(hand) {
                   if(hand.indexOf(':') >=0) {
                       var reg = /(.*?):(.*)/;
                       var m = hand.match(reg);
                       var m1 = m[1];
                       var m2 = m[2];
                      var weightedDiv = $('<div>');
                      weightedDiv.addClass('mdl-color--lime weighted');
                      weightedDiv.attr('data-weight', m2);
                      weightedDiv.attr('data-hand', m1);
                      weightedDiv.width(m2 + '%');

                      var start = 0;
                      $('#cid_' + m1).children('.weighted').each(function() {
                          start+= parseInt(this.getAttribute('data-weight'));
                      });
                       if (start < 1) {
                           start = 0;
                       } else {
                            start = start + '%';
                       }
                      weightedDiv.css('left', start);
                      $('#cid_' + m1).prepend(weightedDiv);
                   } else {
                   $('#cid_' + hand).addClass('mdl-color--lime');
                   }
               });
        }
        if (data.val().category6) {
               data.val().category6.forEach(function(hand) {
                   if(hand.indexOf(':') >=0) {
                       var reg = /(.*?):(.*)/;
                       var m = hand.match(reg);
                       var m1 = m[1];
                       var m2 = m[2];
                      var weightedDiv = $('<div>');
                      weightedDiv.addClass('mdl-color--cyan weighted');
                      weightedDiv.attr('data-weight', m2);
                      weightedDiv.attr('data-hand', m1);
                      weightedDiv.width(m2 + '%');

                      var start = 0;
                      $('#cid_' + m1).children('.weighted').each(function() {
                          start+= parseInt(this.getAttribute('data-weight'));
                      });
                       if (start < 1) {
                           start = 0;
                       } else {
                            start = start + '%';
                       }
                      weightedDiv.css('left', start);
                      $('#cid_' + m1).prepend(weightedDiv);
                   } else {
                   $('#cid_' + hand).addClass('mdl-color--cyan');
                   }
               });
        }
        if (data.val().category7) {
               data.val().category7.forEach(function(hand) {
                   if(hand.indexOf(':') >=0) {
                       var reg = /(.*?):(.*)/;
                       var m = hand.match(reg);
                       var m1 = m[1];
                       var m2 = m[2];
                      var weightedDiv = $('<div>');
                      weightedDiv.addClass('mdl-color--brown weighted');
                      weightedDiv.attr('data-weight', m2);
                      weightedDiv.attr('data-hand', m1);
                      weightedDiv.width(m2 + '%');

                      var start = 0;
                      $('#cid_' + m1).children('.weighted').each(function() {
                          start+= parseInt(this.getAttribute('data-weight'));
                      });
                       if (start < 1) {
                           start = 0;
                       } else {
                            start = start + '%';
                       }
                      weightedDiv.css('left', start);
                      $('#cid_' + m1).prepend(weightedDiv);
                   } else {
                   $('#cid_' + hand).addClass('mdl-color--brown');
                   }
               });
        }
        if (data.val().category8) {
               data.val().category8.forEach(function(hand) {
                   if(hand.indexOf(':') >=0) {
                       var reg = /(.*?):(.*)/;
                       var m = hand.match(reg);
                       var m1 = m[1];
                       var m2 = m[2];
                      var weightedDiv = $('<div>');
                      weightedDiv.addClass('mdl-color--grey weighted');
                      weightedDiv.attr('data-weight', m2);
                      weightedDiv.attr('data-hand', m1);
                      weightedDiv.width(m2 + '%');

                      var start = 0;
                      $('#cid_' + m1).children('.weighted').each(function() {
                          start+= parseInt(this.getAttribute('data-weight'));
                      });
                       if (start < 1) {
                           start = 0;
                       } else {
                            start = start + '%';
                       }
                      weightedDiv.css('left', start);
                      $('#cid_' + m1).prepend(weightedDiv);
                   } else {
                   $('#cid_' + hand).addClass('mdl-color--grey');
                   }
               });
        }
        if (data.val().category9) {
               data.val().category9.forEach(function(hand) {
                   if(hand.indexOf(':') >=0) {
                       var reg = /(.*?):(.*)/;
                       var m = hand.match(reg);
                       var m1 = m[1];
                       var m2 = m[2];
                      var weightedDiv = $('<div>');
                      weightedDiv.addClass('mdl-color--teal weighted');
                      weightedDiv.attr('data-weight', m2);
                      weightedDiv.attr('data-hand', m1);
                      weightedDiv.width(m2 + '%');

                      var start = 0;
                      $('#cid_' + m1).children('.weighted').each(function() {
                          start+= parseInt(this.getAttribute('data-weight'));
                      });
                       if (start < 1) {
                           start = 0;
                       } else {
                            start = start + '%';
                       }
                      weightedDiv.css('left', start);
                      $('#cid_' + m1).prepend(weightedDiv);
                   } else {
                   $('#cid_' + hand).addClass('mdl-color--teal');
                   }
               });
        }
        if (data.val().category10) {
               data.val().category10.forEach(function(hand) {
                   if(hand.indexOf(':') >=0) {
                       var reg = /(.*?):(.*)/;
                       var m = hand.match(reg);
                       var m1 = m[1];
                       var m2 = m[2];
                      var weightedDiv = $('<div>');
                      weightedDiv.addClass('mdl-color--indigo weighted');
                      weightedDiv.attr('data-weight', m2);
                      weightedDiv.attr('data-hand', m1);
                      weightedDiv.width(m2 + '%');

                      var start = 0;
                      $('#cid_' + m1).children('.weighted').each(function() {
                          start+= parseInt(this.getAttribute('data-weight'));
                      });
                       if (start < 1) {
                           start = 0;
                       } else {
                            start = start + '%';
                       }
                      weightedDiv.css('left', start);
                      $('#cid_' + m1).prepend(weightedDiv);
                   } else {
                   $('#cid_' + hand).addClass('mdl-color--indigo');
                   }
               });
        }
        if (data.val().category11) {
               data.val().category11.forEach(function(hand) {
                   if(hand.indexOf(':') >=0) {
                       var reg = /(.*?):(.*)/;
                       var m = hand.match(reg);
                       var m1 = m[1];
                       var m2 = m[2];
                      var weightedDiv = $('<div>');
                      weightedDiv.addClass('mdl-color--purple weighted');
                      weightedDiv.attr('data-weight', m2);
                      weightedDiv.attr('data-hand', m1);
                      weightedDiv.width(m2 + '%');

                      var start = 0;
                      $('#cid_' + m1).children('.weighted').each(function() {
                          start+= parseInt(this.getAttribute('data-weight'));
                      });
                       if (start < 1) {
                           start = 0;
                       } else {
                            start = start + '%';
                       }
                      weightedDiv.css('left', start);
                      $('#cid_' + m1).prepend(weightedDiv);
                   } else {
                   $('#cid_' + hand).addClass('mdl-color--purple');
                   }
               });
        }
        if (data.val().category12) {
               data.val().category12.forEach(function(hand) {
                   if(hand.indexOf(':') >=0) {
                       var reg = /(.*?):(.*)/;
                       var m = hand.match(reg);
                       var m1 = m[1];
                       var m2 = m[2];
                      var weightedDiv = $('<div>');
                      weightedDiv.addClass('mdl-color--pink weighted');
                      weightedDiv.attr('data-weight', m2);
                      weightedDiv.attr('data-hand', m1);
                      weightedDiv.width(m2 + '%');

                      var start = 0;
                      $('#cid_' + m1).children('.weighted').each(function() {
                          start+= parseInt(this.getAttribute('data-weight'));
                      });
                       if (start < 1) {
                           start = 0;
                       } else {
                            start = start + '%';
                       }
                      weightedDiv.css('left', start);
                      $('#cid_' + m1).prepend(weightedDiv);
                   } else {
                   $('#cid_' + hand).addClass('mdl-color--pink');
                   }
               });
        }
        if (data.val().category13) {
               data.val().category13.forEach(function(hand) {
                   if(hand.indexOf(':') >=0) {
                       var reg = /(.*?):(.*)/;
                       var m = hand.match(reg);
                       var m1 = m[1];
                       var m2 = m[2];
                      var weightedDiv = $('<div>');
                      weightedDiv.addClass('mdl-color--light-green weighted');
                      weightedDiv.attr('data-weight', m2);
                      weightedDiv.attr('data-hand', m1);
                      weightedDiv.width(m2 + '%');

                      var start = 0;
                      $('#cid_' + m1).children('.weighted').each(function() {
                          start+= parseInt(this.getAttribute('data-weight'));
                      });
                       if (start < 1) {
                           start = 0;
                       } else {
                            start = start + '%';
                       }
                      weightedDiv.css('left', start);
                      $('#cid_' + m1).prepend(weightedDiv);
                   } else {
                   $('#cid_' + hand).addClass('mdl-color--light-green');
                   }
               });
        }
        if (data.val().category14) {
               data.val().category14.forEach(function(hand) {
                   if(hand.indexOf(':') >=0) {
                       var reg = /(.*?):(.*)/;
                       var m = hand.match(reg);
                       var m1 = m[1];
                       var m2 = m[2];
                      var weightedDiv = $('<div>');
                      weightedDiv.addClass('mdl-color--orange weighted');
                      weightedDiv.attr('data-weight', m2);
                      weightedDiv.attr('data-hand', m1);
                      weightedDiv.width(m2 + '%');

                      var start = 0;
                      $('#cid_' + m1).children('.weighted').each(function() {
                          start+= parseInt(this.getAttribute('data-weight'));
                      });
                       if (start < 1) {
                           start = 0;
                       } else {
                            start = start + '%';
                       }
                      weightedDiv.css('left', start);
                      $('#cid_' + m1).prepend(weightedDiv);
                   } else {
                   $('#cid_' + hand).addClass('mdl-color--orange');
                   }
               });
        }
        if (data.val().category15) {
               data.val().category15.forEach(function(hand) {
                   if(hand.indexOf(':') >=0) {
                       var reg = /(.*?):(.*)/;
                       var m = hand.match(reg);
                       var m1 = m[1];
                       var m2 = m[2];
                      var weightedDiv = $('<div>');
                      weightedDiv.addClass('mdl-color--deep-orange weighted');
                      weightedDiv.attr('data-weight', m2);
                      weightedDiv.attr('data-hand', m1);
                      weightedDiv.width(m2 + '%');

                      var start = 0;
                      $('#cid_' + m1).children('.weighted').each(function() {
                          start+= parseInt(this.getAttribute('data-weight'));
                      });
                       if (start < 1) {
                           start = 0;
                       } else {
                            start = start + '%';
                       }
                      weightedDiv.css('left', start);
                      $('#cid_' + m1).prepend(weightedDiv);
                   } else {
                   $('#cid_' + hand).addClass('mdl-color--deep-orange');
                   }
               });
        }
        if (data.val().category16) {
               data.val().category16.forEach(function(hand) {
                   if(hand.indexOf(':') >=0) {
                       var reg = /(.*?):(.*)/;
                       var m = hand.match(reg);
                       var m1 = m[1];
                       var m2 = m[2];
                      var weightedDiv = $('<div>');
                      weightedDiv.addClass('mdl-color--deep-purple weighted');
                      weightedDiv.attr('data-weight', m2);
                      weightedDiv.attr('data-hand', m1);
                      weightedDiv.width(m2 + '%');

                      var start = 0;
                      $('#cid_' + m1).children('.weighted').each(function() {
                          start+= parseInt(this.getAttribute('data-weight'));
                      });
                       if (start < 1) {
                           start = 0;
                       } else {
                            start = start + '%';
                       }
                      weightedDiv.css('left', start);
                      $('#cid_' + m1).prepend(weightedDiv);
                   } else {
                   $('#cid_' + hand).addClass('mdl-color--deep-purple');
                   }
               });
        }


        if (data.val().buttons) {
            $.each(data.val().buttons, function(key, value) {
               if (value != 'add') {
                setButtons(key, value);
               } else {
                hideButtons(key);
               }
            });
        }

        updatePercent();

        }


    });
})

});
