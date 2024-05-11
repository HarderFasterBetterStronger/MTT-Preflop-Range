/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

window.ranger = window.ranger || {};

/**
 * Handles all Firebase interactions.
 */
ranger.Firebase = class {
  /**
   * Number of posts loaded initially and per page for the feeds.
   * @return {number}
   */
  static get POSTS_PAGE_SIZE() {
    return 20;
  }

  /**
   * Number of posts loaded initially and per page for the User Profile page.
   * @return {number}
   */
  static get USER_PAGE_POSTS_PAGE_SIZE() {
    return 20;
  }

  /**
   * Number of posts comments loaded initially and per page.
   * @return {number}
   */
  static get COMMENTS_PAGE_SIZE() {
    return 3;
  }

  /**
   * Initializes this Firebase facade.
   * @constructor
   */
  constructor() {
    // Firebase SDK.
    this.database = firebase.database();
    this.auth = firebase.auth();

    // Firebase references that are listened to.
    this.firebaseRefs = [];
  }

  /***** Range Viewer Functions *****/
  createNewGrouping(title) {
      const groupingKey = this.database.ref('viewers').push().key;
      var update = {};
      update['/viewers/' + this.auth.currentUser.uid + '/' + groupingKey] = {
        author: {
          uid: this.auth.currentUser.uid,
          full_name: this.auth.currentUser.displayName,
          profile_picture: this.auth.currentUser.photoURL
        },
        title: title
      };

      this.database.ref().update(update).then(function() {
        return groupingKey;
      });
      return groupingKey;

  }

  saveGrouping(key, title) {

      var update = {};
      const tabKey = this.database.ref('viewers').push().key;
      update['/viewerNav/' + this.auth.currentUser.uid + '/' + key + '/' + tabKey] = title;

      this.database.ref().update(update);

      var groupingsRef = this.database.ref('/viewerNav/' + this.auth.currentUser.uid + '/' + key + '/');

      groupingsRef.on('child_added', data => {
         var safeId = data.val().replace(/[^A-Z0-9]+/ig, "_");

          $('.viewerTabs').hide();

          //<a class="tabBtn mdl-navigation__link" href="#">New Button</a>
         var navElement = document.createElement('a');
         navElement.id = safeId;
         navElement.classList.add('mdl-navigation__link');
         navElement.classList.add('viewerBtns');
         navElement.textContent = safeId;
         navElement.setAttribute('data-id', data.key);

         componentHandler.upgradeElement(navElement);

         $('.viewerTabs').removeClass('activeTab');

         var navChild = document.createElement('div');
         navChild.id = data.key;
         navChild.classList.add('viewerTabs');
         navChild.classList.add('activeTab');

         var addPosts = document.createElement('a');
         addPosts.classList.add('viewerAddPosts');
         addPosts.textContent = 'Add Post';
         componentHandler.upgradeElement(addPosts);

         navChild.append(addPosts);

         $('#viewerContent').append(navChild);


         $('#viewerNavBar').append(navElement);


         /*$('#page-range').append('<div class="mdl-tabs__panel" id="'+safeId+'"><button class=" addPost mdl-button mdl-js-button mdl-button--fab"><i class="material-icons">add</i></button></div>');*/

      });

      groupingsRef.off();

      return tabKey;
  }

  addPostToViewer(key, tab, id, title) {
      var updates = {};
      updates['/viewerPosts/' + this.auth.currentUser.uid + '/' + key + '/' + tab +'/' + id] = title;
      return this.database.ref().update(updates);
  }

  updateGroupingTitle(key, title) {
      this.database.ref('/viewers/' + this.auth.currentUser.uid + '/' + key).update({
         title: title
      });
  }

  /**
   * Turns off all Firebase listeners.
   */
  cancelAllSubscriptions() {
    this.firebaseRefs.forEach(ref => ref.off());
    this.firebaseRefs = [];
  }

  /**
   * Subscribes to receive updates from a post's comments. The given `callback` function gets
   * called for each new comment to the post with ID `postId`.
   *
   * If provided we'll only listen to comments that were posted after `latestCommentId`.
   */
  subscribeToComments(postId, callback, latestCommentId) {
    return this._subscribeToFeed(`/comments/${postId}`, callback, latestCommentId, false);
  }

  /**
   * Paginates comments from the post with ID `postId`.
   *
   * Fetches a page of `COMMENTS_PAGE_SIZE` comments from the post.
   *
   * We return a `Promise` which resolves with an Map of comments and a function to the next page or
   * `null` if there is no next page.
   */
  getComments(postId) {
    return this._getPaginatedFeed(`/comments/${postId}`,
        ranger.Firebase.COMMENTS_PAGE_SIZE, null, false);
  }

  /**
   * Subscribes to receive updates to the general posts feed. The given `callback` function gets
   * called for each new post to the general post feed.
   *
   * If provided we'll only listen to posts that were posted after `latestPostId`.
   */
  subscribeToGeneralFeed(callback, latestPostId) {
    return this._subscribeToFeed('/posts/', callback, latestPostId);
  }

  subscribeToReviewFeed(callback, latestPostId) {
      return this._subscribeToFeed(`/review/${this.auth.currentUser.uid}`, callback, latestPostId);
  }
  subscribeToReviewGroupFeed(callback, latestPostId, groupId) {
      return this._subscribeToFeed(`/groups/${groupId}/posts`, callback, latestPostId);
  }

  /**
   * Paginates posts from the global post feed.
   *
   * Fetches a page of `POSTS_PAGE_SIZE` posts from the global feed.
   *
   * We return a `Promise` which resolves with an Map of posts and a function to the next page or
   * `null` if there is no next page.
   */
  getPosts() {
    var paginatedPosts = this._getPaginatedFeed(`/feed/${this.auth.currentUser.uid}`, ranger.Firebase.POSTS_PAGE_SIZE, null, true);
      return paginatedPosts;
  }

  getReviewPosts() {
      var paginatedPosts = this._getPaginatedFeed(`/review/${this.auth.currentUser.uid}`, ranger.Firebase.POSTS_PAGE_SIZE, null, true);
      return paginatedPosts;
  }
  copyToPosts(userId, postId, title) {
    var update = {};
    update[`/people/${userId}/posts/${postId}`] = title;
    firebase.database().ref().update(update);
  }

  getGroupPosts() {
      var paginatedPosts = this._getPaginatedFeed(`/groups/${groupId}/posts`, ranger.Firebase.POSTS_PAGE_SIZE, null, true);
      return paginatedPosts;
  }

  /**
   * Subscribes to receive updates to the home feed. The given `callback` function gets called for
   * each new post to the general post feed.
   *
   * If provided we'll only listen to posts that were posted after `latestPostId`.
   */
  subscribeToHomeFeed(callback, latestPostId) {
    return this._subscribeToFeed(`/feed/${this.auth.currentUser.uid}`, callback, latestPostId,
        true);
  }

  /**
   * Paginates posts from the user's home feed.
   *
   * Fetches a page of `POSTS_PAGE_SIZE` posts from the user's home feed.
   *
   * We return a `Promise` which resolves with an Map of posts and a function to the next page or
   * `null` if there is no next page.
   */
  getHomeFeedPosts() {
    return this._getPaginatedFeed(`/people/${this.auth.currentUser.uid}/posts`,
        ranger.Firebase.POSTS_PAGE_SIZE, null, true);
  }

  /**
   * Subscribes to receive updates to the home feed. The given `callback` function gets called for
   * each new post to the general post feed.
   *
   * If provided we'll only listen to posts that were posted after `latestPostId`.
   */
  subscribeToUserFeed(uid, callback, latestPostId) {
    return this._subscribeToFeed(`/people/${uid}/posts`, callback,
        latestPostId, true);
  }

  /**
   * Paginates posts from the user's posts feed.
   *
   * Fetches a page of `USER_PAGE_POSTS_PAGE_SIZE` posts from the user's posts feed.
   *
   * We return a `Promise` which resolves with an Map of posts and a function to the next page or
   * `null` if there is no next page.
   */
  getUserFeedPosts(uid) {
    return this._getPaginatedFeed(`/people/${uid}/posts`,
        ranger.Firebase.USER_PAGE_POSTS_PAGE_SIZE, null, true);
  }

  /**
   * Subscribes to receive updates to the given feed. The given `callback` function gets called
   * for each new entry on the given feed.
   *
   * If provided we'll only listen to entries that were posted after `latestEntryId`. This allows to
   * listen only for new feed entries after fetching existing entries using `_getPaginatedFeed()`.
   *
   * If needed the posts details can be fetched. This is useful for shallow post feeds.
   * @private
   */
  _subscribeToFeed(uri, callback, latestEntryId = null, fetchPostDetails = false) {
    // Load all posts information.
    let feedRef = this.database.ref(uri);
    if (latestEntryId) {
      feedRef = feedRef.orderByKey().startAt(latestEntryId);
    }
    feedRef.on('child_added', feedData => {
      if (feedData.key !== latestEntryId) {
        if (feedData.child('public') === 'true') {
            if (!fetchPostDetails) {
              callback(feedData.key, feedData.val());
            } else {
              this.database.ref(`/posts/${feedData.key}`).once('value').then(
                  postData => callback(postData.key, postData.val()));
            }
        }
      }
    });
    this.firebaseRefs.push(feedRef);
  }

  /**
   * Paginates entries from the given feed.
   *
   * Fetches a page of `pageSize` entries from the given feed.
   *
   * If provided we'll return entries that were posted before (and including) `earliestEntryId`.
   *
   * We return a `Promise` which resolves with an Map of entries and a function to the next page or
   * `null` if there is no next page.
   *
   * If needed the posts details can be fetched. This is useful for shallow post feeds like the user
   * home feed and the user post feed.
   * @private
   */
  _getPaginatedFeed(uri, pageSize, earliestEntryId = null, fetchPostDetails = false) {
    let ref = this.database.ref(uri);
    if (earliestEntryId) {
      ref = ref.orderByKey().endAt(earliestEntryId);
    } else if (uri === '/posts/') {
        ref = ref.orderByChild('public').equalTo(true);
    }

    // We're fetching an additional item as a cheap way to test if there is a next page.
    return ref.limitToLast(pageSize + 1).once('value').then(data => {
      const entries = data.val() || {};

      // Figure out if there is a next page.
      let nextPage = null;
      const entryIds = Object.keys(entries);
      if (entryIds.length > pageSize) {
        delete entries[entryIds[0]];
        const nextPageStartingId = entryIds.shift();
        nextPage = () => this._getPaginatedFeed(
            uri, pageSize, nextPageStartingId, fetchPostDetails);
      }
      if (fetchPostDetails) {
        // Fetch details of all posts.
        const queries = entryIds.map(postId => this.getPostData(postId));
        // Since all the requests are being done one the same feed it's unlikely that a single one
        // would fail and not the others so using Promise.all() is not so risky.
        return Promise.all(queries).then(results => {
          const deleteOps = [];
          results.forEach(result => {
            if (result.val()) {
              entries[result.key] = result.val();
            } else {
              // We encountered a deleted post. Removing permanently from the feed.
              delete entries[result.key];
              deleteOps.push(this.deleteFromFeed(uri, result.key));
            }
          });
          if (deleteOps.length > 0) {
            // We had to remove some deleted posts from the feed. Lets run the query again to get
            // the correct number of posts.
            return this._getPaginatedFeed(uri, pageSize, earliestEntryId, fetchPostDetails);
          }
          return {entries: entries, nextPage: nextPage};
        });
      }
      return {entries: entries, nextPage: nextPage};
    });
  }

  /**
   * Keeps the home feed populated with latest followed users' posts live.
   */
  startHomeFeedLiveUpdaters() {
    // Make sure we listen on each followed people's posts.
    const followingRef = this.database.ref(`/people/${this.auth.currentUser.uid}/following`);
    this.firebaseRefs.push(followingRef);
    followingRef.on('child_added', followingData => {
      // Start listening the followed user's posts to populate the home feed.
      const followedUid = followingData.key;
      let followedUserPostsRef = this.database.ref(`/people/${followedUid}/posts`);
      if (followingData.val() instanceof String) {
        followedUserPostsRef = followedUserPostsRef.orderByKey().startAt(followingData.val());
      }
      this.firebaseRefs.push(followedUserPostsRef);
      followedUserPostsRef.on('child_added', postData => {
        if (postData.key !== followingData.val()) {
          const updates = {};
          updates[`/feed/${this.auth.currentUser.uid}/${postData.key}`] = true;
          updates[`/people/${this.auth.currentUser.uid}/following/${followedUid}`] = postData.key;
          this.database.ref().update(updates);
        }
      });
    });
    // Stop listening to users we unfollow.
    followingRef.on('child_removed', followingData => {
      // Stop listening the followed user's posts to populate the home feed.
      const followedUserId = followingData.key;
      this.database.ref(`/people/${followedUserId}/posts`).off();
    });
  }

  /**
   * Updates the home feed with new followed users' posts and returns a promise once that's done.
   */
  updateHomeFeeds() {
    // Make sure we listen on each followed people's posts.
    const followingRef = this.database.ref(`/people/${this.auth.currentUser.uid}/following`);
    return followingRef.once('value', followingData => {
      // Start listening the followed user's posts to populate the home feed.
      const following = followingData.val();
      if (!following) {
        return;
      }
      const updateOperations = Object.keys(following).map(followedUid => {
        let followedUserPostsRef = this.database.ref(`/people/${followedUid}/posts`);
        const lastSyncedPostId = following[followedUid];
        if (lastSyncedPostId instanceof String) {
          followedUserPostsRef = followedUserPostsRef.orderByKey().startAt(lastSyncedPostId);
        }
        return followedUserPostsRef.once('value', postData => {
          const updates = {};
          if (!postData.val()) {
            return;
          }
          Object.keys(postData.val()).forEach(postId => {
            if (postId !== lastSyncedPostId) {
              updates[`/feed/${this.auth.currentUser.uid}/${postId}`] = true;
              updates[`/people/${this.auth.currentUser.uid}/following/${followedUid}`] = postId;
            }
          });
          return this.database.ref().update(updates);
        });
      });
      return Promise.all(updateOperations);
    });
  }

  /**
   * Returns the users which name match the given search query as a Promise.
   */
  searchUsers(searchString, maxResults) {
    searchString = latinize(searchString).toLowerCase();
    const query = this.database.ref('/people')
        .orderByChild('_search_index/full_name').startAt(searchString)
        .limitToFirst(maxResults).once('value');
    const reversedQuery = this.database.ref('/people')
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

  searchFollowers(searchString, maxResults) {
    searchString = latinize(searchString).toLowerCase();
    const followers = this.database.ref('/followers/' + this.auth.currentUser.uid).once('value');

    const query = this.database.ref('/people')
        .orderByChild('_search_index/full_name').startAt(searchString)
        .limitToFirst(maxResults).once('value');
    const reversedQuery = this.database.ref('/people')
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

          //console.log(followers);
      });

      return people;
    });
  }

  searchGroups(searchString, maxResults) {
    searchString = latinize(searchString).toLowerCase();

    const query = this.database.ref('/people/'+this.auth.currentUser.uid+'/groups')
        .limitToFirst(maxResults).once('value');
      return query.then(groups => {
          const groupResults = {};
          groups.forEach(function(group) {
              groupResults[group.key] = group.val();
          });

          const groupIds = Object.keys(groupResults);
          groupIds.forEach(groupId => {
             const group = groupResults[groupId];
              if (group.toLowerCase().indexOf(searchString) === -1) {
                  delete groupResults[groupId];
              }
          });

          return groupResults;
      });

  }

  searchPosts() {
      const query = this.database.ref('/people/'+this.auth.currentUser.uid+'/posts').limitToFirst(100).once('value');

      return query;
  }

  /**
   * Saves or updates public user data in Firebase (such as image URL, display name...).
   */
  saveUserData(imageUrl, displayName) {
    if (!displayName) {
      displayName = 'Anonymous';
    }
    let searchFullName = displayName.toLowerCase();
    let searchReversedFullName = searchFullName.split(' ').reverse().join(' ');
    try {
      searchFullName = latinize(searchFullName);
      searchReversedFullName = latinize(searchReversedFullName);
    } catch (e) {
      console.error(e);
    }
    const updateData = {
      profile_picture: imageUrl,
      full_name: displayName,
      _search_index: {
        full_name: searchFullName,
        reversed_full_name: searchReversedFullName
      }
    };
    return this.database.ref(`/people/${this.auth.currentUser.uid}`).update(updateData);
  }

  /**
   * Fetches a single post data.
   */
  getPostData(postId) {
    return this.database.ref(`/posts/${postId}`).once('value');
  }

  /**
   * Subscribe to receive updates on a user's post like status.
   */
  registerToUserLike(postId, callback) {
    // Load and listen to new Likes.
    const likesRef = this.database.ref(`likes/${postId}/${this.auth.currentUser.uid}`);
    likesRef.on('value', data => callback(!!data.val()));
    this.firebaseRefs.push(likesRef);
  }

  /**
   * Updates the like status of a post from the current user.
   */
  updateLike(postId, value) {
    return this.database.ref(`likes/${postId}/${this.auth.currentUser.uid}`)
        .set(value ? firebase.database.ServerValue.TIMESTAMP : null);
  }

  /**
   * Adds a comment to a post.
   */
  addComment(postId, commentText) {
    const commentObject = {
      text: commentText,
      timestamp: Date.now(),
      author: {
        uid: this.auth.currentUser.uid,
        full_name: this.auth.currentUser.displayName,
        profile_picture: this.auth.currentUser.photoURL
      }
    };
    return this.database.ref(`comments/${postId}`).push(commentObject);
  }
  updateComment(postId, commentId, comment) {
      return this.database.ref(`comments/${postId}/${commentId}`).update({
         text: comment
      });
  }
  deleteComment(postId, commentId) {
      return this.database.ref(`comments/${postId}/${commentId}`).remove();
  }

  shareToFeed(postId, userId) {
      console.log('sharing');
      const update = {};
      var followerCheck = this.database.ref(`followers/${this.auth.currentUser.uid}/${userId}`);

      followerCheck.on('value', function(snapshot) {
         if(snapshot.exists()) {
             update[`/review/${userId}/${postId}`] = true;
             firebase.database().ref().update(update);
         } else {
          swal(
          'Oops...',
          'Can only share hands with followers',
          'error'
          )
         }
      });
  }
  removeFromFeed(userId, postId) {
      this.database.ref(`review/${userId}/${postId}`).remove().then(function() {
        ranger.MaterialUtils.updateBadges();
      });
  }
  checkReviewPosts(postId) {
      var postRef = this.database.ref(`/review/${this.auth.currentUser.uid}`);
      postRef.once('value', function(snapshot) {
         if(snapshot.hasChild(postId)) {
             console.log('exists');
         } else {
             console.log('delete');
         }
      });
  }

  /*** Groups ***/
  addMember(postId, userId, userName) {
      const update = {};
      update[`/posts/${postId}/members/${userId}`] = userName;
      update[`/ranges/${postId}/members/${userId}`] = userName;
      update[`/filters/${postId}/members/${userId}`] = userName;
      this.database.ref().update(update);
  }
  removeMember(postId, userId) {
      const update = {};
      //update[`/posts/${postId}/members/${userId}`].remove();
      //update[`/ranges/${postId}/members/${userId}`].remove();
      //update[`/filters/${postId}/members/${userId}`].remove();

      this.database.ref(`/posts/${postId}/members/${userId}`).remove();
      this.database.ref(`/ranges/${postId}/members/${userId}`).remove();
      this.database.ref(`/filters/${postId}/members/${userId}`).remove();
  }
  loadGroups() {
      const groupsRef = this.database.ref(`/people/${this.auth.currentUser.uid}/groups`);
      groupsRef.on('child_added', groupsData => {
         ranger.groupsPage.groupsAddHtmlFunction(groupsData.key, groupsData.val());
        });
      this.firebaseRefs.push(groupsRef);

  }
  createGroup(groupName) {
      const groupsKey = this.database.ref('groups').push().key;
      const update = {};
      update['/groups/' + groupsKey + '/admins/' + this.auth.currentUser.uid] = true;
      update['/groups/' + groupsKey + '/' + this.auth.currentUser.uid] = this.auth.currentUser.displayName;
      update['/groups/' + groupsKey + '/groupName'] = groupName;
      update['/people/' + this.auth.currentUser.uid + '/groups/' + groupsKey] = groupName;

      this.database.ref().update(update);
      return groupsKey;
  }

  loadGroupUsers(groupKey) {
      return this.database.ref(`/groups/${groupKey}/members`).once('value');
  }

  addGroupMember(groupId, groupName, userId, displayName) {
      const update = {}
      update[`/groups/${groupId}/members/${userId}`] = displayName;
      return this.database.ref().update(update);
  }
  deleteGroupMember(groupId, memberId) {
      return this.database.ref(`groups/${groupId}/members/${memberId}`).remove();
  }

  copyToGroup(postKey, groupKey) {
    var newGroupPost = this.database.ref().child('posts').push().key;

    var updates = {};
    updates['/groups/' + groupKey + '/posts/' + newGroupPost] = true;

    var postDataRef = firebase.database().ref('/posts/' + postKey);
    var rangeDataRef = firebase.database().ref('/ranges/' + postKey);
    var filterDataRef = firebase.database().ref('/filters/' + postKey);

    var promise1 = postDataRef.once('value', function(data) {
        firebase.database().ref('posts').child(newGroupPost).set(data.val(), function(error) {
            if(error) {
              console.log(error);
            }
        });
    });
    var promise2 = rangeDataRef.once('value', function(data) {
        firebase.database().ref('ranges').child(newGroupPost).set(data.val(), function(error) {
            if(error) {
              console.log(error);
            }
        });
    });
    var promise3 = filterDataRef.once('value', function(data) {
        firebase.database().ref('filters').child(newGroupPost).set(data.val(), function(error) {
            if(error) {
              console.log(error);
            }
        });
    });

    this.database.ref().update(updates);

  }

  /*** Get New Post Key ***/
  createNewPost() {
      const newRangeKey = this.database.ref().child('posts').push().key;
      const update = {};
      update['/posts/' + newRangeKey] = {
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        author: {
          uid: this.auth.currentUser.uid,
          full_name: this.auth.currentUser.displayName,
          profile_picture: this.auth.currentUser.photoURL
        },
        public: false,
        text: 'Post from - ' + this.auth.currentUser.displayName
      };
      update['/ranges/' + newRangeKey] = {
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        author: {
          uid: this.auth.currentUser.uid,
          full_name: this.auth.currentUser.displayName,
          profile_picture: this.auth.currentUser.photoURL
        }
      };
      update['/filters/' + newRangeKey] = {
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        author: {
          uid: this.auth.currentUser.uid,
          full_name: this.auth.currentUser.displayName,
          profile_picture: this.auth.currentUser.photoURL
        }
      }
      update['/people/'+this.auth.currentUser.uid+'/posts/'+newRangeKey] = 'Post from - ' + this.auth.currentUser.displayName;


      this.database.ref().update(update).then(function() {
        return newRangeKey;
      }, function(error) {
          console.log(error);
      });
      return newRangeKey;
  }

  loadRangePost(postId) {
      return this.database.ref('/posts/'+postId).once('value').then(function(data) {
          return data.val();
      }, function(error) {
        alert('Upgrade to view Coaching Hands');
        page('/');
      });
  }

  loadRangeFilters(postId) {
      return this.database.ref('/filters/'+postId).once('value').then(function(data) {
        return data.val();
      }, function(error) {
        alert('Upgrade to view Coaching Hands');
        page('/');
      });
  }

  updateTitle(key, title) {
      this.database.ref('/posts/' + key).update({
          text: title
      });

      this.database.ref('/people/' + this.auth.currentUser.uid + '/posts/' + key).set(title);
  }
  duplicateFilter(postKey, rangeKey, name) {
    const newRangeFilterKey = this.database.ref('/filters/'+postKey).push().key;

    var filterDataRef = firebase.database().ref('/filters/' + postKey + '/' + rangeKey);
    var rangeDataRef = firebase.database().ref('/ranges/' + postKey + '/' + rangeKey);

    var promise1 = filterDataRef.once('value', function(data) {
        firebase.database().ref('/filters/' + postKey).child(newRangeFilterKey).set(data.val(), function(error) {
            if(error) {
              console.log(error);
            }
        });

        firebase.database().ref('/filters/'+postKey+'/'+newRangeFilterKey).update({
            name: name
        });
    });
    var promise2 = rangeDataRef.once('value', function(data) {
        firebase.database().ref('/ranges/' + postKey).child(newRangeFilterKey).set(data.val(), function(error) {
            if(error) {
              console.log(error);
            }
        });

    });

    return newRangeFilterKey;
  }
  setPublic(postKey) {
       return this.database.ref('/posts/'+postKey).update({
            public: $('#public_tgl').is(':checked')
        });
  }
  getUserRole(uid) {
      var ref = this.database.ref('/users/'+uid);
      return ref.once('value', function(data) {
          return data;
      });
  }

  addRangeFilter(key, name) {
      const newRangeFilterKey = this.database.ref('/ranges/'+key).push().key;
      this.database.ref('/filters/'+key+'/'+newRangeFilterKey).update({
          name: name
      });
        return newRangeFilterKey;
  }
  saveRange(postKey, rangeKey, name = '') {
      if (name != '') {
          this.database.ref('/filters/'+postKey+'/'+rangeKey).update({
              name: name
          });
      }

    var category1 = [];
    var category2 = [];
    var category3 = [];
    var category4 = [];
    var category5 = [];
    var category6 = [];
    var category7 = [];
    var category8 = [];
    var category9 = [];
    var category10 = [];
    var category11 = [];
    var category12 = [];
    var category13 = [];
    var category14 = [];
    var category15 = [];
    var category16 = [];

    var buttons = {
        'mdl-color--green': $('#mdl-color--green').text(),
        'mdl-color--amber': $('#mdl-color--amber').text(),
        'mdl-color--red': $('#mdl-color--red').text(),
        'mdl-color--blue': $('#mdl-color--blue').text(),
        'mdl-color--lime': $('#mdl-color--lime').text(),
        'mdl-color--cyan': $('#mdl-color--cyan').text(),
        'mdl-color--brown': $('#mdl-color--brown').text(),
        'mdl-color--grey': $('#mdl-color--grey').text(),
        'mdl-color--teal': $('#mdl-color--teal').text(),
        'mdl-color--indigo': $('#mdl-color--indigo').text(),
        'mdl-color--purple': $('#mdl-color--purple').text(),
        'mdl-color--pink': $('#mdl-color--pink').text(),
        'mdl-color--light-green': $('#mdl-color--light-green').text(),
        'mdl-color--orange': $('#mdl-color--orange').text(),
        'mdl-color--deep-orange': $('#mdl-color--deep-orange').text(),
        'mdl-color--deep-purple': $('#mdl-color--deep-purple').text()
    }

   $.each( $('.cell.mdl-color--green'), function(key, value) {
        category1.push(value.textContent);
    });

   $.each( $('.cell.mdl-color--amber'), function(key, value) {
        category2.push(value.textContent);
    });

   $.each( $('.cell.mdl-color--red'), function(key, value) {
        category3.push(value.textContent);
    });

   $.each( $('.cell.mdl-color--blue'), function(key, value) {
        category4.push(value.textContent);
    });

   $.each( $('.cell.mdl-color--lime'), function(key, value) {
        category5.push(value.textContent);
    });

   $.each( $('.cell.mdl-color--cyan'), function(key, value) {
        category6.push(value.textContent);
    });

   $.each( $('.cell.mdl-color--brown'), function(key, value) {
        category7.push(value.textContent);
    });

   $.each( $('.cell.mdl-color--grey'), function(key, value) {
        category8.push(value.textContent);
    });
   $.each( $('.cell.mdl-color--teal'), function(key, value) {
        category9.push(value.textContent);
    });
   $.each( $('.cell.mdl-color--indigo'), function(key, value) {
        category10.push(value.textContent);
    });

   $.each( $('.cell.mdl-color--purple'), function(key, value) {
        category11.push(value.textContent);
    });

   $.each( $('.cell.mdl-color--pink'), function(key, value) {
        category12.push(value.textContent);
    });
   $.each( $('.cell.mdl-color--light-green'), function(key, value) {
        category13.push(value.textContent);
    });
   $.each( $('.cell.mdl-color--orange'), function(key, value) {
        category14.push(value.textContent);
    });
   $.each( $('.cell.mdl-color--deep-orange'), function(key, value) {
        category15.push(value.textContent);
    });
   $.each( $('.cell.mdl-color--deep-purple'), function(key, value) {
        category16.push(value.textContent);
    });
   $.each( $('.weighted.mdl-color--green'), function(key, value) {
       category1.push(value.getAttribute('data-hand') + ':' + value.getAttribute('data-weight'));
   });
   $.each( $('.weighted.mdl-color--amber'), function(key, value) {
       category2.push(value.getAttribute('data-hand') + ':' + value.getAttribute('data-weight'));
   });
   $.each( $('.weighted.mdl-color--red'), function(key, value) {
       category3.push(value.getAttribute('data-hand') + ':' + value.getAttribute('data-weight'));
   });
   $.each( $('.weighted.mdl-color--blue'), function(key, value) {
       category4.push(value.getAttribute('data-hand') + ':' + value.getAttribute('data-weight'));
   });
   $.each( $('.weighted.mdl-color--lime'), function(key, value) {
       category5.push(value.getAttribute('data-hand') + ':' + value.getAttribute('data-weight'));
   });
   $.each( $('.weighted.mdl-color--cyan'), function(key, value) {
       category6.push(value.getAttribute('data-hand') + ':' + value.getAttribute('data-weight'));
   });
   $.each( $('.weighted.mdl-color--brown'), function(key, value) {
       category7.push(value.getAttribute('data-hand') + ':' + value.getAttribute('data-weight'));
   });
   $.each( $('.weighted.mdl-color--grey'), function(key, value) {
       category8.push(value.getAttribute('data-hand') + ':' + value.getAttribute('data-weight'));
   });
   $.each( $('.weighted.mdl-color--teal'), function(key, value) {
       category9.push(value.getAttribute('data-hand') + ':' + value.getAttribute('data-weight'));
   });
   $.each( $('.weighted.mdl-color--indigo'), function(key, value) {
       category10.push(value.getAttribute('data-hand') + ':' + value.getAttribute('data-weight'));
   });
   $.each( $('.weighted.mdl-color--purple'), function(key, value) {
       category11.push(value.getAttribute('data-hand') + ':' + value.getAttribute('data-weight'));
   });
   $.each( $('.weighted.mdl-color--pink'), function(key, value) {
       category12.push(value.getAttribute('data-hand') + ':' + value.getAttribute('data-weight'));
   });
   $.each( $('.weighted.mdl-color--light-green'), function(key, value) {
       category13.push(value.getAttribute('data-hand') + ':' + value.getAttribute('data-weight'));
   });
   $.each( $('.weighted.mdl-color--orange'), function(key, value) {
       category14.push(value.getAttribute('data-hand') + ':' + value.getAttribute('data-weight'));
   });
   $.each( $('.weighted.mdl-color--deep-orange'), function(key, value) {
       category15.push(value.getAttribute('data-hand') + ':' + value.getAttribute('data-weight'));
   });
   $.each( $('.weighted.mdl-color--deep-purple'), function(key, value) {
       category16.push(value.getAttribute('data-hand') + ':' + value.getAttribute('data-weight'));
   });

    this.database.ref('/ranges/'+postKey+'/'+rangeKey).update({
        category1: category1,
        category2: category2,
        category3: category3,
        category4: category4,
        category5: category5,
        category6: category6,
        category7: category7,
        category8: category8,
        category9: category9,
        category10: category10,
        category11: category11,
        category12: category12,
        category13: category13,
        category14: category14,
        category15: category15,
        category16: category16,
        buttons: buttons
    });
  }

loadRange(postKey, rangeKey) {

    $('.colorSelect').each(function(index) {
        $(this).text('').append('<i class="material-icons">add</i>');
    });

    var setButtons = function(button, value) {
        $('#' + button).text(value);
    };

    $('#fullTable td').removeClass('mdl-color--green mdl-color--amber mdl-color--red mdl-color--blue mdl-color--lime mdl-color--cyan mdl-color--brown mdl-color--grey mdl-color--teal mdl-color--indigo mdl-color--purple mdl-color--pink mdl-color--light-green mdl-color--orange mdl-color--deep-orange mdl-color--deep-purple');

    ranger.range.clearGrid();

    this.database.ref('/ranges/'+postKey+'/'+rangeKey).once('value', function(data) {
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
               }
            });
        }
            ranger.range.updatePercent(false);

        }

        ranger.range.updatePercent(false);

    });

}

  saveHandHistory(postKey, handHistory, handPreview = 'Failed', raw = '', replayerKey = '') {
      return this.database.ref('/posts/'+postKey).update({
          handHistory: handHistory,
          handPreview: handPreview,
          raw: raw,
          replayer: replayerKey
      });
  }

  saveErrorHistory(hh) {
    return this.database.ref('/errors/').push({handHistory: hh});
  }

  /** Check Post Permissions **/
  checkPostPermissions(userId, postId) {
      var owner = this.database.ref(`/posts/${postId}/author/${userId}`).once('value');
      var member = this.database.ref(`/posts/${postId}/members/${userId}`).once('value');

      console.log(owner.val());
      console.log(member.val());
      return true;
  }

  /**
   * Create New Range
   * This returns a Promise which completes with the new Tab ID.
   */
   createNewRange(newRangeKey) {
   //get a reference to where the post will be created.
   //const newRangeKey = this.database.ref('/posts').push().key;

   const update = {};
      //update['/people/'+this.auth.currentUser.uid+'/posts/'+newRangeKey] = 'Post from - ' + this.auth.currentUser.uid;
      update['/feed/'+this.auth.currentUser.uid+'/'+newRangeKey] = true;
      return this.database.ref().update(update).then(() => newRangeKey);
   }

   deleteRange(postKey, rangeKey) {
       return this.database.ref('/filters/'+postKey+'/'+rangeKey).remove();
   }

  /**
   * Follow/Unfollow a user and return a promise once that's done.
   *
   * If the user is now followed we'll add all his posts to the home feed of the follower.
   * If the user is now not followed anymore all his posts are removed from the follower home feed.
   */
  toggleFollowUser(followedUserId, follow) {
    // Add or remove posts to the user's home feed.
    return this.database.ref(`/people/${followedUserId}/posts`).once('value').then(
        data => {
          const updateData = {};
          let lastPostId = true;

          //Add followed user's posts to the home feed.
          data.forEach(post => {
            updateData[`/feed/${this.auth.currentUser.uid}/${post.key}`] = follow ? !!follow : null;

            lastPostId = post.key;
          });

          // Add followed user to the 'following' list.
          updateData[`/people/${this.auth.currentUser.uid}/following/${followedUserId}`] =
              follow ? lastPostId : null;

          // Add signed-in user to the list of followers.
          updateData[`/followers/${followedUserId}/${this.auth.currentUser.uid}`] =
              follow ? !!follow : null;
          return this.database.ref().update(updateData);
        });
  }

  /**
   * Listens to updates on the followed status of the given user.
   */
  registerToFollowStatusUpdate(userId, callback) {
    const followStatusRef =
        this.database.ref(`/people/${this.auth.currentUser.uid}/following/${userId}`);
    followStatusRef.on('value', callback);
    this.firebaseRefs.push(followStatusRef);
  }

  /**
   * Enables or disables the notifications for that user.
   */
  toggleNotificationEnabled(checked) {
    return this.database.ref(`/people/${this.auth.currentUser.uid}/notificationEnabled`)
        .set(checked ? checked : null);
  }

  /**
   * Saves the given notification token.
   */
  saveNotificationToken(token) {
    return this.database.ref(`/people/${this.auth.currentUser.uid}/notificationTokens/${token}`)
        .set(true);
  }

  /**
   * Listens to updates on the Enable notifications status of the current user.
   */
  registerToNotificationEnabledStatusUpdate(callback) {
    const followStatusRef =
        this.database.ref(`/people/${this.auth.currentUser.uid}/notificationEnabled`);
    followStatusRef.on('value', callback);
    this.firebaseRefs.push(followStatusRef);
  }

  /**
   * Load a single user profile information
   */
  loadUserProfile(uid) {
    return this.database.ref(`/people/${uid}`).once('value');
  }

  /**
   * Listens to updates on the likes of a post and calls the callback with likes counts.
   * TODO: This won't scale if a user has a huge amount of likes. We need to keep track of a
   *       likes count instead.
   */
  registerForLikesCount(postId, likesCallback) {
    const likesRef = this.database.ref(`/likes/${postId}`);
    likesRef.on('value', data => likesCallback(data.numChildren()));
    this.firebaseRefs.push(likesRef);
  }

  /**
   * Listens to updates on the comments of a post and calls the callback with comments counts.
   */
  registerForCommentsCount(postId, commentsCallback) {
    const commentsRef = this.database.ref(`/comments/${postId}`);
    commentsRef.on('value', data => commentsCallback(data.numChildren()));
    this.firebaseRefs.push(commentsRef);
  }

  /**
   * Listens to updates on the followers of a person and calls the callback with followers counts.
   * TODO: This won't scale if a user has a huge amount of followers. We need to keep track of a
   *       follower count instead.
   */
  registerForFollowersCount(uid, followersCallback) {
    const followersRef = this.database.ref(`/followers/${uid}`);
    followersRef.on('value', data => followersCallback(data.numChildren()));
    this.firebaseRefs.push(followersRef);
  }

  /**
   * Listens to updates on the followed people of a person and calls the callback with its count.
   */
  registerForFollowingCount(uid, followingCallback) {
    const followingRef = this.database.ref(`/people/${uid}/following`);
    followingRef.on('value', data => followingCallback(data.numChildren()));
    this.firebaseRefs.push(followingRef);
  }

  /**
   * Listens for changes of the thumbnail URL of a given post.
   */
  registerForThumbChanges(postId, callback) {
    const thumbRef = this.database.ref(`/posts/${postId}/thumb_url`);
    thumbRef.on('value', data => callback(data.val()));
    this.firebaseRefs.push(thumbRef);
  }

  /**
   * Fetch the list of followed people's profile.
   */
  getFollowingProfiles(uid) {
    return this.database.ref(`/people/${uid}/following`).once('value').then(data => {
      if (data.val()) {
        const followingUids = Object.keys(data.val());
        const fetchProfileDetailsOperations = followingUids.map(
          followingUid => this.loadUserProfile(followingUid));
        return Promise.all(fetchProfileDetailsOperations).then(results => {
          const profiles = {};
          results.forEach(result => {
            if (result.val()) {
              profiles[result.key] = result.val();
            }
          });
          return profiles;
        });
      }
      return {};
    });
  }

  /**
   * Listens to updates on the user's posts and calls the callback with user posts counts.
   */
  registerForPostsCount(uid, postsCallback) {
    const userPostsRef = this.database.ref(`/people/${uid}/posts`);
    userPostsRef.on('value', data => postsCallback(data.numChildren()));
    this.firebaseRefs.push(userPostsRef);
  }

  /**
   * Deletes the given post from the global post feed and the user's post feed. Also deletes
   * comments, likes and the file on Cloud Storage.
   */
  deletePost(postId, picStorageUri, thumbStorageUri) {
    console.log(`Deleting ${postId}`);
    const updateObj = {};
    updateObj[`/people/${this.auth.currentUser.uid}/posts/${postId}`] = null;
    updateObj[`/comments/${postId}`] = null;
    updateObj[`/likes/${postId}`] = null;
    updateObj[`/posts/${postId}`] = null;
    updateObj[`/feed/${this.auth.currentUser.uid}/${postId}`] = null;
    updateObj[`/filters/${postId}`] = null;
    updateObj[`/ranges/${postId}`] = null;
    const deleteFromDatabase = this.database.ref().update(updateObj);
        $(`.fp-post-${postId}`).remove();
    return deleteFromDatabase;
  }

  /**
   * Deletes the given postId entry from the user's home feed.
   */
  deleteFromFeed(uri, postId) {
    return this.database.ref(`${uri}/${postId}`).remove();
  }

  /**
   * Listens to deletions on posts from the global feed.
   */
  registerForPostsDeletion(deletionCallback) {
    const postsRef = this.database.ref(`/posts`);
    postsRef.on('child_removed', data => deletionCallback(data.key));
    this.firebaseRefs.push(postsRef);
  }
};

ranger.firebase = new ranger.Firebase();
