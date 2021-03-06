// npm packages
import React, {Component} from 'react';
import {Link} from 'react-router-dom';

// our packages
import {Crunchyroll} from '../api';
import {HistoryPropType} from '../utils';

export default class Episode extends Component {
  constructor(props) {
    super(props);

    this.state = {
      episode: null,
      file: null,
    };

    // trigger episode loading
    this.init(props);
  }

  componentDidUpdate() {
    const {episode, file} = this.state;

    if (!episode || !file) {
      return;
    }

    videojs('video', {
      plugins: {
        ass: {
          src: file.subtitles,
        },
      },
    });
  }

  async init(props) {
    const {location} = props;
    const file = await Crunchyroll.getEpisode(location.state);
    this.setState({
      episode: location.state,
      file,
    });
  }

  render() {
    const {episode, file} = this.state;
    const {history} = this.props;

    let body = <div>Loading...</div>;

    if (episode && file) {
      body = (
        <video id="video" className="video-js" controls autoPlay preload="auto">
          <source src={file.url} type={file.type} />
        </video>
      );
    }
    return (
      <div>
        <nav className="nav">
          <div className="nav-left nav-menu">
            <div className="nav-item">
              <Link to="/" className=" button" onClick={() => history.goBack()}>
                <span className="icon">
                  <i className="fa fa-arrow-left" />
                </span>
                <span>Back</span>
              </Link>
            </div>
          </div>
        </nav>

        {body}
      </div>
    );
  }
}
Episode.propTypes = {
  // eslint-disable-next-line react/no-typos
  history: HistoryPropType.isRequired,
};
