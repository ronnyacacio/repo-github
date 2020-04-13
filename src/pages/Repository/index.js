import React, { Component } from 'react';
import Select from 'react-select';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

import api from '../../services/api';

import { Loading, Owner, IssueList, SelectStateIssue } from './styles';
import Container from '../../components/Container';

export default class Repository extends Component {
  // eslint-disable-next-line react/static-property-placement
  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        repo: PropTypes.string,
      }),
    }).isRequired,
  };

  // eslint-disable-next-line react/state-in-constructor
  state = {
    repository: {},
    issues: [],
    loading: true,
    stateIssue: 'all',
  };

  async componentDidMount() {
    const { match } = this.props;

    const repoName = decodeURIComponent(match.params.repo);

    const { stateIssue } = this.state;

    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          state: stateIssue,
          per_page: 5,
        },
      }),
    ]);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false,
    });
  }

  componentDidUpdate(_, prevState) {
    const { stateIssue } = this.state;

    if (prevState.stateIssue !== stateIssue) this.saveStateIssue();
  }

  handleChangeSelect = (selectedOption) => {
    this.setState({ stateIssue: selectedOption });
  };

  saveStateIssue = async () => {
    const { repository, stateIssue } = this.state;

    const issues = await api.get(`/repos/${repository.full_name}/issues`, {
      params: {
        state: stateIssue.value,
        per_page: 5,
      },
    });

    this.setState({
      issues: issues.data,
      loading: false,
    });
  };

  render() {
    const { repository, issues, loading, stateIssue } = this.state;

    if (loading) return <Loading>Carregando...</Loading>;

    const optionsSelect = [
      { value: 'all', label: 'all' },
      { value: 'open', label: 'open' },
      { value: 'closed', label: 'closed' },
    ];

    const customStyles = {
      menu: (provided, _) => ({
        ...provided,
        color: '#7159c1',
      }),
    };

    return (
      <Container>
        <Owner>
          <Link to="/">Voltar aos repositórios</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>
        <SelectStateIssue>
          <Select
            options={optionsSelect}
            styles={customStyles}
            value={stateIssue}
            onChange={this.handleChangeSelect}
          />
        </SelectStateIssue>
        <IssueList>
          {issues.map((issue) => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />
              <div>
                <strong>
                  <a href={issue.html_url}>{issue.title}</a>
                  {issue.labels.map((label) => (
                    <span key={String(label.id)}>{label.name}</span>
                  ))}
                </strong>
                <p>{issue.user.login}</p>
              </div>
            </li>
          ))}
        </IssueList>
      </Container>
    );
  }
}
