import React from 'react';
import { render } from 'react-dom';
import { renderRoutes } from '../tworooms/routes.js';

$(document).ready(function () {
    render(renderRoutes(), document.getElementById('render-target'));
});