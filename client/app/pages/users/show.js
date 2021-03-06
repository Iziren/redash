import { each } from 'lodash';
import settingsMenu from '@/services/settingsMenu';
import { absoluteUrl } from '@/services/utils';
import template from './show.html';
import './settings.less';

function UserCtrl(
  $scope, $routeParams, $http, $location, toastr,
  clientConfig, currentUser, User, AlertDialog,
) {
  $scope.userId = $routeParams.userId;
  $scope.currentUser = currentUser;
  $scope.clientConfig = clientConfig;

  if ($scope.userId === undefined) {
    $scope.userId = currentUser.id;
  }

  $scope.canEdit = currentUser.hasPermission('admin') || currentUser.id === parseInt($scope.userId, 10);
  $scope.showSettings = false;
  $scope.showPasswordSettings = false;

  $scope.selectTab = (tab) => {
    $scope.selectedTab = tab;
    each($scope.tabs, (v, k) => {
      $scope.tabs[k] = (k === tab);
    });
  };

  $scope.setTab = (tab) => {
    $scope.selectedTab = tab;
    $location.hash(tab);
  };

  $scope.tabs = {
    profile: false,
    apiKey: false,
    settings: false,
    password: false,
  };

  $scope.selectTab($location.hash() || 'profile');

  $scope.user = User.get({ id: $scope.userId }, (user) => {
    if (user.auth_type === 'password') {
      $scope.showSettings = $scope.canEdit;
      $scope.showPasswordSettings = $scope.canEdit;
    }
  });

  $scope.password = {
    current: '',
    new: '',
    newRepeat: '',
  };

  $scope.savePassword = (form) => {
    if (!form.$valid) {
      return;
    }

    const data = {
      id: $scope.user.id,
      password: $scope.password.new,
      old_password: $scope.password.current,
    };

    User.save(data, () => {
      toastr.success('Password Saved.');
      $scope.password = {
        current: '',
        new: '',
        newRepeat: '',
      };
    }, (error) => {
      const message = error.data.message || 'Failed saving password.';
      toastr.error(message);
    });
  };

  $scope.updateUser = (form) => {
    if (!form.$valid) {
      return;
    }

    const data = {
      id: $scope.user.id,
      name: $scope.user.name,
      email: $scope.user.email,
    };

    User.save(data, (user) => {
      toastr.success('Saved.');
      $scope.user = user;
    }, (error) => {
      const message = error.data.message || 'Failed saving.';
      toastr.error(message);
    });
  };

  $scope.isCollapsed = true;

  $scope.sendPasswordReset = () => {
    $scope.disablePasswordResetButton = true;
    $http.post(`api/users/${$scope.user.id}/reset_password`).success((data) => {
      $scope.disablePasswordResetButton = false;
      $scope.passwordResetLink = absoluteUrl(data.reset_link);
    });
  };

  $scope.resendInvitation = () => {
    $http.post(`api/users/${$scope.user.id}/invite`).success(() => {
      toastr.success('Invitation sent.', {
        timeOut: 10000,
      });
    });
  };

  $scope.enableUser = (user) => {
    User.enableUser(user);
  };
  $scope.disableUser = (user) => {
    User.disableUser(user);
  };

  $scope.regenerateUserApiKey = (user) => {
    const doRegenerate = () => {
      $scope.disableRegenerateApiKeyButton = true;
      $http
        .post(`api/users/${$scope.user.id}/regenerate_api_key`)
        .success((data) => {
          toastr.success('The API Key has been updated.');
          user.api_key = data.api_key;
          $scope.disableRegenerateApiKeyButton = false;
        })
        .error((response) => {
          const message =
            response.message
              ? response.message
              : `Failed regenerating API Key: ${response.statusText}`;

          toastr.error(message);
          $scope.disableRegenerateApiKeyButton = false;
        });
    };

    const title = 'Regenerate API Key';
    const message = 'Are you sure you want to regenerate?';

    AlertDialog.open(title, message, { class: 'btn-warning', title: 'Regenerate' })
      .then(doRegenerate);
  };
}

export default function init(ngModule) {
  settingsMenu.add({
    title: 'Account',
    path: 'users/me',
    order: 7,
  });

  ngModule.controller('UserCtrl', UserCtrl);

  return {
    '/users/me': {
      template,
      reloadOnSearch: false,
      controller: 'UserCtrl',
      title: 'Account',
    },
    '/users/:userId': {
      template,
      reloadOnSearch: false,
      controller: 'UserCtrl',
      title: 'Users',
    },
  };
}

init.init = true;
