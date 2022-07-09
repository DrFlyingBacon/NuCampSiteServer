const express = require('express');
const Favorite = require('../models/favorite');
const authenticate = require('../authenticate');
const cors = require('./cors');

const favoriteRouter = express.Router();

favoriteRouter
    .route('/')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        console.log(req.user._id);
        Favorite.find({ user: req.user._id })
            .populate('user')
            .populate('campsites')
            .then(favorite => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
            })
            .catch(err => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOne({ user: req.user._id })
            .then(favorite => {
                if (favorite) {
                    const favoritedCampsitesObject = favorite.campsites.reduce((acc, campsite) => {
                        return { ...acc, [campsite._id]: true };
                    }, {});
                    console.log(favoritedCampsitesObject);
                    const favoritesFiltered = req.body.filter(
                        campsite => !favoritedCampsitesObject[campsite._id]
                    );
                    console.log(favoritesFiltered);
                    console.log(req.user._id);
                    console.log(favorite);
                    Favorite.findByIdAndUpdate(
                        favorite._id,
                        {
                            campsites: [
                                ...favorite.campsites,
                                ...favoritesFiltered.map(obj => obj._id)
                            ]
                        },
                        { new: true }
                    ).then(favorite => {
                        res.json(favorite);
                    });
                } else {
                    Favorite.create({ user: req.user._id, campsites: req.body }).then(favorite => {
                        console.log('Favorite Created ', favorite);
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorite);
                    });
                }
            })
            .catch(err => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /favorites');
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOneAndDelete()
            .then(favorite => {
                if (favorite) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                    return;
                }
                res.setHeader('Content-Type', 'text/plain');
                res.end('You do not have any favorites to delete.');
            })
            .catch(err => next(err));
    });

favoriteRouter
    .route('/:campsiteId')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end(`GET operation not supported on /favorites/${req.params.campsiteId}`);
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
        Favorite.findOne({ user: req.user._id }).then(favorite => {
            if (favorite) {
                if (favorite.campsites.includes(req.params.campsiteId)) {
                    res.setHeader('Content-Type', 'text/plain');
                    res.end('That campsite is already in the list of favorites!');
                } else {
                    favorite.campsites.push(req.params.campsiteId);
                    favorite
                        .save()
                        .then(favorite => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favorite);
                        })
                        .catch(err => next(err));
                }
            } else {
                console.log('Not fount the favorite', favorite);
                Favorite.create({
                    user: req.user._id,
                    campsites: [req.params.campsiteId]
                })
                    .then(favorite => {
                        console.log('Favorite Created ', favorite);
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorite);
                    })
                    .catch(err => next(err));
            }
        });
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end(`PUT operation not supported on /favorites/${req.params.campsiteId}`);
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOne({ user: req.user._id }).then(favorite => {
            if (favorite) {
                if (favorite.campsites.includes(req.params.campsiteId)) {
                    favorite.campsites = favorite.campsites.filter(
                        campsite => campsite.toString() !== req.params.campsiteId
                    );

                    favorite
                        .save()
                        .then(favorite => {
                            console.log('Favorite Deleted ', favorite);
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favorite);
                        })
                        .catch(err => next(err));
                } else {
                    res.setHeader('Content-Type', 'text/plain');
                    res.end('Campsite not in list of favorites');
                }
            } else {
                res.setHeader('Content-Type', 'text/plain');
                res.end('No favorites to delete');
            }
        });
    });

module.exports = favoriteRouter;
