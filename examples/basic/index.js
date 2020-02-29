import _ from 'lodash';

function createComponent() {
    const element = document.createElement('div');

    element.innerHTML = _.join(['Hello', 'World'], ' ')

    return element;
}

document.body.appendChild(createComponent());