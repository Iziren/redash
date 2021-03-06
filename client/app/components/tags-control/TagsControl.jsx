import { map, trim, extend } from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { react2angular } from 'react2angular';
import Tooltip from 'antd/lib/tooltip';
import TagsEditorModal from './TagsEditorModal';

export class TagsControl extends React.Component {
  static propTypes = {
    tags: PropTypes.arrayOf(PropTypes.string),
    canEdit: PropTypes.bool,
    getAvailableTags: PropTypes.func,
    onEdit: PropTypes.func,
    className: PropTypes.string,
    children: PropTypes.node,
  };

  static defaultProps = {
    tags: [],
    canEdit: false,
    getAvailableTags: () => Promise.resolve([]),
    onEdit: () => {},
    className: '',
    children: null,
  };

  state = {
    showModal: false,
  };

  openEditModal = () => {
    this.setState({ showModal: true });
  };

  closeEditModal = () => {
    this.setState({ showModal: false });
  };

  onTagsChanged = (newTags) => {
    this.props.onEdit(newTags);
    this.closeEditModal();
  };

  renderEditButton() {
    const tags = map(this.props.tags, trim);
    const buttonLabel = tags.length > 0
      ? <i className="zmdi zmdi-edit" />
      : <React.Fragment><i className="zmdi zmdi-plus m-r-5" />Add tag</React.Fragment>;

    return (
      <React.Fragment>
        <a className="label label-tag" role="none" onClick={this.openEditModal}>{buttonLabel}</a>
        {this.state.showModal && (
          <TagsEditorModal
            tags={tags}
            getAvailableTags={this.props.getAvailableTags}
            onConfirm={this.onTagsChanged}
            onCancel={this.closeEditModal}
          />
        )}
      </React.Fragment>
    );
  }

  render() {
    return (
      <div className={'tags-control ' + this.props.className}>
        {this.props.children}
        {map(this.props.tags, tag => (
          <span className="label label-tag" key={tag} title={tag}>{tag}</span>
        ))}
        {this.props.canEdit && this.renderEditButton()}
      </div>
    );
  }
}

function modelTagsControl({ archivedTooltip }) {
  // See comment for `propTypes`/`defaultProps`
  // eslint-disable-next-line react/prop-types
  function ModelTagsControl({ isDraft, isArchived, ...props }) {
    return (
      <TagsControl {...props}>
        {!isArchived && isDraft && (
          <span className="label label-tag-unpublished">Unpublished</span>
        )}
        {isArchived && (
          <Tooltip placement="right" title={archivedTooltip}>
            <span className="label label-tag-archived">Archived</span>
          </Tooltip>
        )}
      </TagsControl>
    );
  }

  // ANGULAR_REMOVE_ME `extend` needed just for `react2angular`, so remove it when `react2angular` no longer needed
  ModelTagsControl.propTypes = extend({
    isDraft: PropTypes.bool,
    isArchived: PropTypes.bool,
  }, TagsControl.propTypes);

  ModelTagsControl.defaultProps = extend({
    isDraft: false,
    isArchived: false,
  }, TagsControl.defaultProps);

  return ModelTagsControl;
}

export const QueryTagsControl = modelTagsControl({
  archivedTooltip: 'This query is archived and can\'t be used in dashboards, or appear in search results.',
});

export const DashboardTagsControl = modelTagsControl({
  archivedTooltip: 'This dashboard is archived and won\'t be listed in dashboards nor search results.',
});

export default function init(ngModule) {
  ngModule.component('queryTagsControl', react2angular(QueryTagsControl));
  ngModule.component('dashboardTagsControl', react2angular(DashboardTagsControl));
}

init.init = true;
