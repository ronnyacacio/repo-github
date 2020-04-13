import React, { Component } from 'react';
import Select from 'react-select';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

import api from '../../services/api';

import {
  Loading,
  Owner,
  IssueList,
  SelectStateIssue,
  DivButtons,
  PageButton,
} from './styles';
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
    page: 1,
  };

  async componentDidMount() {
    const { match } = this.props;

    const repoName = decodeURIComponent(match.params.repo);

    const { stateIssue, page } = this.state;

    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          state: stateIssue,
          per_page: 5,
          page,
        },
      }),
    ]);

    await this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false,
    });
  }

  componentDidUpdate(_, prevState) {
    const { stateIssue, page } = this.state;

    if (prevState.stateIssue !== stateIssue) this.saveStateIssue();

    if (prevState.page !== page) this.savePage();
  }

  handleChangeSelect = async (selectedOption) => {
    await this.setState({ stateIssue: selectedOption });
  };

  saveStateIssue = async () => {
    const { repository, stateIssue, page } = this.state;

    const issues = await api.get(`/repos/${repository.full_name}/issues`, {
      params: {
        state: stateIssue.value,
        per_page: 5,
        page,
      },
    });

    await this.setState({
      issues: issues.data,
      loading: false,
    });
  };

  savePage = async () => {
    const { repository, stateIssue, page } = this.state;

    const issues = await api.get(`/repos/${repository.full_name}/issues`, {
      params: {
        state: stateIssue.value,
        per_page: 5,
        page,
      },
    });

    await this.setState({
      page,
      issues: issues.data,
      loading: false,
    });
  };

  handlePage = async (action) => {
    const { page } = this.state;
    await this.setState({
      page: action === 'back' ? page - 1 : page + 1,
    });
  };

  render() {
    const { repository, issues, loading, stateIssue, page } = this.state;

    if (loading) return <Loading>Carregando...</Loading>;

    const optionsSelect = [
      { value: 'all', label: 'all' },
      { value: 'open', label: 'open' },
      { value: 'closed', label: 'closed' },
    ];

    const customStyles = {
      menu: (provided) => ({
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
        <DivButtons>
          <PageButton
            disabled={page < 2}
            onClick={() => this.handlePage('back')}
          >
            <FaArrowLeft color="#FFF" size={14} />
          </PageButton>
          <span>Página {page}</span>
          <PageButton onClick={() => this.handlePage('next')}>
            <FaArrowRight color="#FFF" size={14} />
          </PageButton>
        </DivButtons>
      </Container>
    );
  }
}
