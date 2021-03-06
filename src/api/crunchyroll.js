// npm packages
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import cheerio from 'cheerio';
import electron from 'electron';

// our packages
import db from '../db';
import {dowloadSubtitles, getStreamUrl} from './youtubedl';

// base URL used for most requests
const baseURL = 'http://www.crunchyroll.com';
// temp folder for videos
const userDataPath = (electron.app || electron.remote.app).getPath('userData');
const targetFolder = path.join(userDataPath, 'crunchyroll');
try {
  fs.accessSync(targetFolder);
} catch (e) {
  fs.mkdirSync(targetFolder);
}

// main module
export default {
  async getAllSeries(page = 0) {
    // load catalogue
    // http://www.crunchyroll.com/videos/anime/popular/ajax_page?pg=1
    const {data} = await axios.get(
      `${baseURL}/videos/anime/popular/ajax_page?pg=${page}`
    );
    // create cheerio cursor
    const $ = cheerio.load(data);
    const series = $('li.group-item')
      .map((index, el) => {
        const element = $(el);
        // get title & url
        const a = $('a', element);
        const title = a.attr('title');
        const _id = a.attr('href');
        const url = `${baseURL}${_id}`;
        // get image
        const img = $('img', element);
        const image = img.attr('src');
        // get videos count
        const seriesData = $('.series-data', element);
        const count = parseInt(
          seriesData
            .text()
            .trim()
            .replace('Videos', '')
            .trim(),
          10
        );
        // return series data;
        return {
          _id,
          title,
          url,
          image,
          count,
          source: 'crunchyroll',
        };
      })
      .get();

    // store in the db
    await db.series.bulkDocs(series);

    return series;
  },
  async getEpisodes(series) {
    // load episodes
    const {data} = await axios.get(series.url);
    // create cheerio cursor
    const $ = cheerio.load(data);
    const episodesContainer = $('.list-of-seasons ul.portrait-grid');
    const episodes = $('.group-item', episodesContainer)
      .map((index, el) => {
        const element = $(el);
        const _id = $('a.episode', element).attr('href');
        const url = `${baseURL}${_id}`;
        const img = $('img', element);
        const image = img.attr('src') || img.attr('data-thumbnailurl');
        const title = $('.series-title', element)
          .text()
          .trim();
        const description = $('.short-desc', element)
          .text()
          .trim();
        return {
          _id,
          url,
          image,
          title,
          description,
          series: series._id,
        };
      })
      .get();

    // store in the db
    await db.episodes.bulkDocs(episodes);

    return episodes;
  },
  async getEpisode(episode) {
    const filename = `${episode._id
      .replace(/^\//g, '')
      .replace(/\//g, '-')}.mp4`;
    const subtitles = await dowloadSubtitles({
      url: episode.url,
      targetFolder,
      filename,
    });
    const url = await getStreamUrl(episode.url);
    const type = 'application/x-mpegURL';

    return {type, url, subtitles};
  },
  getMySeries() {},
  search(query) {},
};
