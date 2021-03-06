"use strict";

import {Utils} from "../../../good-funcs.js/dist/js/GoodFuncs.js";

export namespace QooizPlayer {

    /**
     * Интерфейс конфига плеера
     */
    interface IPlayerOptions {

        /**
         * Путь к файлу со стилями
         */
        readonly styleFilePath? : string;

        /**
         * Класс блока просмотра
         */
        readonly mainWrapperClass? : string;

        /**
         * Класс блока превью
         */
        readonly imageWrapperClass? : string;

        /**
         * Ширина кпопок прокрутки
         */
        readonly scrollButtonsWidth? : number;

        /**
         * Погрешность клика по кнопкам прокрутки
         */
        readonly scrollButtonsPadding? : number;

        /**
         * Изображения с этим классом не загружаются в плеер
         */
        readonly imageStopClass? : string;
    }

    /**
     * Просмотрщик на чистом JavaScript. На данный момент может отображать видео, графику и книги в формате PDF.
     */
    export class Player implements IPlayerOptions {

        /**
         * Начало рендеринга
         *
         * @param {HTMLDivElement} mainWrapper
         * @param {HTMLSpanElement} curImage
         * @param {string} selector
         */
        protected static renderInit(
            mainWrapper : HTMLDivElement,
            curImage : HTMLSpanElement,
            selector : string
        ) : void {
            if (curImage.classList.contains('current')) {
                return;
            }

            mainWrapper.querySelectorAll(selector).forEach(function (element : HTMLElement) {
                element.style.display = 'none';
            });

            if (curImage.parentElement) {
                Array.from(curImage.parentElement.children).forEach(function (imageSpan) {
                    imageSpan.classList.remove('current')
                });
            }

            curImage.classList.add('current');
        }

        /**
         * Рендеринг видео в плеере
         *
         * @param {HTMLDivElement} mainWrapper - блок хранящий видео
         * @param {HTMLSpanElement} curImage - загружаемое изображение
         *
         * @returns {HTMLVideoElement | null}
         */
        protected static renderVideo(
            mainWrapper : HTMLDivElement,
            curImage : HTMLSpanElement
        ) : HTMLVideoElement | null {

            Player.renderInit(mainWrapper, curImage, 'video');

            let videoSrc : string = curImage.dataset.objectSrc || '',
                imageSrc = curImage.dataset.src;

            if (!videoSrc) {
                return null;
            }

            for (let video of Array.from(mainWrapper.querySelectorAll('video'))) {
                if (video.getAttribute('src') === videoSrc) {
                    video.style.display = 'block';
                    return video;
                }
            }

            let video : HTMLVideoElement = Utils.GoodFuncs.createElementWithAttrs(
                'video',
                {
                    src: videoSrc,
                    controls: 'controls',
                    poster: imageSrc,
                    preload: 'metadata',
                    controlsList: 'nodownload',
                    text: 'Видео не доступно',
                    volume: 'high',
                    status: 'stop',
                    fullscreen: 'no'/*,
                    width: mainWrapper.innerWidth(),
                    height: mainWrapper.innerWidth() * curImage.innerHeight() / curImage.innerWidth()*/
                }
            ) as HTMLVideoElement;

            mainWrapper.insertAdjacentElement(
                'beforeend',
                video
            );

            return video;
        }

        /**
         * Рендеринг изображения в плеере
         *
         * @param {HTMLDivElement} mainWrapper - блок хранящий изображения
         * @param {HTMLSpanElement} curImage - загружаемое изображение
         *
         * @returns {HTMLImageElement | null}
         */
        protected static renderImage(
            mainWrapper : HTMLDivElement,
            curImage : HTMLSpanElement
        ) : HTMLImageElement | null {

            Player.renderInit(mainWrapper, curImage, 'img');

            let imageSrc = curImage.dataset.src;

            for (let image of Array.from(mainWrapper.querySelectorAll('img'))) {
                if (image.getAttribute('src') === imageSrc) {
                    image.style.display = 'block';
                    return image;
                }
            }

            let image = Utils.GoodFuncs.createElementWithAttrs(
                'img',
                {
                    class: 'materialboxed responsive-img',
                    src: imageSrc
                }) as HTMLImageElement;

            mainWrapper.insertAdjacentElement(
                'beforeend',
                image
            );

            if (window['M'] !== undefined) {
                M.Materialbox.init(image);
            }

            return image;
        }

        /**
         * Рендеринг книги в плеере
         *
         * @param {HTMLDivElement} mainWrapper - блок хранящий изображения
         * @param {HTMLSpanElement} curImage - загружаемое изображение
         *
         * @returns {HTMLIFrameElement | HTMLEmbedElement | null}
         */
        protected static renderBook(
            mainWrapper : HTMLDivElement,
            curImage : HTMLSpanElement
        ) : HTMLIFrameElement | HTMLEmbedElement | null {

            Player.renderInit(mainWrapper, curImage, 'iframe, embed');

            let bookSrc : string = curImage.dataset.objectSrc || '',
                bookSrcMatches : RegExpMatchArray | null = bookSrc.match(/.+?\.([^.]+)$/),
                bookType = curImage.dataset.type || (bookSrcMatches ? bookSrcMatches[1] : '');

            if (!bookSrc || !bookType) {
                return null;
            }

            for (let book of (Array.from(mainWrapper.querySelectorAll('embed, iframe')) as HTMLIFrameElement[] | HTMLEmbedElement[])) {
                if (book.getAttribute('src') === bookSrc) {
                    book.style.display = 'block';
                    return book.tagName === 'iframe' ? book as HTMLIFrameElement : book as HTMLEmbedElement;
                }
            }

            let book = document.createElement('iframe');

            switch (bookType) {
                case 'pdf':
                    book.setAttribute('src', bookSrc);
                    break;

                default:
                    book.setAttribute('src', 'https://docs.google.com/viewer?url=' + document.location.origin + bookSrc + '&embedded=true');
            }

            book.allowFullscreen = true;

            mainWrapper.insertAdjacentElement(
                'beforeend',
                book
            );

            return book;
        }

        /**
         * Параметры конфигурации по умолчанию
         *
         * @type {IPlayerOptions}
         */
        public static defaultOptions : IPlayerOptions = {
            styleFilePath: 'player.css',
            mainWrapperClass: 'main-wrapper',
            imageWrapperClass: 'image-wrapper',
            scrollButtonsWidth: 50,
            scrollButtonsPadding: 10,
            imageStopClass: 'no-image'
        };

        /**
         * Где хранятся стили плеера
         */
        public readonly styleFilePath : string;

        /**
         * Выбирать ли первый элемент после загрузки
         */
        public readonly activate : boolean;

        public readonly mainWrapperClass : string;

        public readonly imageWrapperClass : string;

        public readonly scrollButtonsWidth : number;

        public readonly scrollButtonsPadding : number;

        public readonly imageStopClass : string;

        public readonly animationDuration : number = 400;

        /**
         * Обработчик добавления новой сущности
         */
        protected render : (curImage : HTMLElement) => HTMLElement | null;

        /**
         * Уникальный идентификатор плеера
         */
        protected readonly uniq : string = Utils.GoodFuncs.getRandomString(12);

        /**
         * Блок просмотра
         */
        public readonly mainWrapper : HTMLDivElement;

        /**
         * Блок превью
         */
        public readonly imageWrapper : HTMLDivElement;

        /**
         * Тип плеера
         */
        protected type : 'video' | 'image' | 'book';

        /**
         * На каком элементе загружается плеер
         */
        public readonly element : HTMLElement;

        public readonly emptyPlayerImage : HTMLImageElement | null;

        public readonly emptyPlayerImageDisplay : string | null;

        public readonly playerElement : HTMLElement;

        protected prevScroll : number = 0;

        protected diffWidth : number = 0;

        protected imagesWidth : number = 0;

        protected images : HTMLSpanElement[] = [];

        protected position : number = 0;

        protected fullscreenButtonAdded = false;

        protected setRender() : void {
            const self = this;
            if (this.playerElement.classList.contains('video')) {

                this.render = function (curImage : HTMLElement) {
                    self.emptyPlayerImage && (self.emptyPlayerImage.style.display = 'none');
                    return Player.renderVideo(self.mainWrapper, curImage);
                };

                this.type = 'video';

            } else if (this.playerElement.classList.contains('image')) {

                this.render = function (curImage : HTMLElement) {
                    self.emptyPlayerImage && (self.emptyPlayerImage.style.display = 'none');
                    return Player.renderImage(self.mainWrapper, curImage);
                };

                this.type = 'image';

            } else if (this.playerElement.classList.contains('book')) {

                this.render = function (curImage : HTMLElement) {
                    self.emptyPlayerImage && (self.emptyPlayerImage.style.display = 'none');
                    self.addFullScreenButton();
                    return Player.renderBook(self.mainWrapper, curImage);
                };

                this.type = 'book';
            }
        }

        protected addFullScreenButton() : void {
            if (!this.fullscreenButtonAdded) {
                let button = document.createElement('button');
                button.classList.add('fullscreen');
                button.type = 'button';
                this.mainWrapper.append(button);
                button.addEventListener('click', function () {
                    Utils.GoodFuncs.nextAll(this, 'iframe').forEach(function (iframe) {
                        const computedStyle = window.getComputedStyle(iframe);
                        if (computedStyle.display !== 'none') {
                            const rFS = iframe.mozRequestFullScreen
                                || iframe.webkitRequestFullscreen
                                || iframe.requestFullscreen;

                            rFS.call(iframe);
                        }
                    });
                });
                this.fullscreenButtonAdded = true;
            }
        }

        protected setImageClick() : void {
            const self = this;
            this.imageWrapper.addEventListener('click', function (e) {
                let target = e.target as HTMLElement;
                if (!target.matches('.img')) {
                    return;
                }

                e.stopPropagation();

                self.render(target);
                //self.scrollTo(self.images.indexOf(target));
            });
        }

        protected setDeleteClick() : void {
            const self = this;
            this.imageWrapper.addEventListener('click', function (e) {

                e.stopPropagation();
                let target = e.target as HTMLElement;
                if (!target.matches('.img > i')) {
                    return;
                }

                const element = target.parentNode as HTMLSpanElement,
                    index = self.images.indexOf(element);
                if (self.images[index + 1] !== undefined) {
                    self.images[index + 1].click();
                } else if (self.images[index - 1]) {
                    self.images[index - 1].click();
                }

                self.deleteItem(element);

                if (!self.images.length) {
                    self.emptyPlayerImage
                    && self.emptyPlayerImageDisplay
                    && (self.emptyPlayerImage.style.display = self.emptyPlayerImageDisplay);
                }
            });
        }

        protected setScroll() : void {
            const self = this;
            this.imageWrapper.addEventListener('click', function (e : MouseEvent) {

                if (!(e.target as HTMLElement).matches('.' + self.imageWrapperClass)) {
                    return;
                }

                let offset : number = e['detail'] && e['detail']['offset'] !== undefined
                    ? e.detail['offset']
                    : e.offsetX;

                if (!self.images.length || self.imagesWidth <= self.imageWrapper.clientWidth) {
                    return;
                }

                let position = self.position;
                if (offset <= self.scrollButtonsWidth) {
                    if (self.images[position - 1]) {
                        position--;
                        self.diffWidth = 0;
                    }
                } else if (offset >= self.imageWrapper.clientWidth - self.scrollButtonsWidth) {
                    if (!self.diffWidth && self.images[position + 1]) {
                        position++;
                    }
                } else {
                    return;
                }

                const startScroll : number = self.prevScroll;
                if (self.scrollTo(position) === startScroll && position < self.position && startScroll) {
                    this.dispatchEvent(new CustomEvent('click', {detail: {offset: offset}}));
                }
            });

            this.imageWrapper.addEventListener('wheel', function (e : WheelEvent) {
                e.preventDefault();
                if (this['disabled']) {
                    return;
                }

                if (e.deltaY < 0) {
                    this.dispatchEvent(new CustomEvent('click', {detail: {offset: 0}}));
                    return;
                }

                this.dispatchEvent(new CustomEvent('click', {detail: {offset: this.clientWidth}}));
            });
        }

        /**
         *
         * @param {number} index
         *
         * @returns {number}
         */
        public scrollTo(index : number) : number | undefined {
            const self = this;
            if (!this.images[index]) {
                return;
            }

            const currentImage : HTMLSpanElement = this.images[index];
            let scroll : number = 0;
            Utils.GoodFuncs.prevAll(currentImage, '.img').forEach(function (element : HTMLSpanElement) {
                scroll += element.clientWidth;
            });

            if (scroll > this.prevScroll) {
                let viewWidth : number = 0;
                Utils.GoodFuncs.nextAll(currentImage, '.img').forEach(function (element : HTMLSpanElement) {
                    viewWidth += element.clientWidth;
                });
                viewWidth += currentImage.clientWidth;
                if (viewWidth <= this.imageWrapper.clientWidth) {
                    this.diffWidth = this.imageWrapper.clientWidth - viewWidth;
                    scroll -= this.diffWidth;
                }
            } else {
                this.diffWidth = 0;
            }

            this.images.forEach(function (img : HTMLImageElement) {
                img.animate({
                    left: [-self.prevScroll + 'px', -scroll + 'px']
                }, {
                    duration: self.animationDuration,
                    fill: 'forwards'
                })
            });

            this.position = index;
            this.prevScroll = scroll;

            return scroll;
        }

        /**
         * Конструктор
         *
         * @param {HTMLElement} element - на каком элементе загружается плеер
         * @param {IPlayerOptions} cnf - объект конфигурации
         */
        public constructor(element : HTMLElement, cnf : IPlayerOptions = {}) {

            this.playerElement = element;
            this.styleFilePath = (cnf.styleFilePath || Player.defaultOptions.styleFilePath) as string;
            this.activate = !element.classList.contains('no-active');
            this.mainWrapperClass = (cnf.mainWrapperClass || Player.defaultOptions.mainWrapperClass) as string;
            this.imageWrapperClass = (cnf.imageWrapperClass || Player.defaultOptions.imageWrapperClass) as string;
            this.scrollButtonsWidth = (cnf.scrollButtonsWidth || Player.defaultOptions.scrollButtonsWidth) as number;
            this.scrollButtonsPadding
                = (cnf.scrollButtonsPadding || Player.defaultOptions.scrollButtonsPadding) as number;
            this.imageStopClass = (cnf.imageStopClass || Player.defaultOptions.imageStopClass) as string;
            this.emptyPlayerImage = element.querySelector(`img.${this.imageStopClass}`);
            this.emptyPlayerImageDisplay = this.emptyPlayerImage ? this.emptyPlayerImage.style.display : null;

            element.classList.add('player');

            element.insertAdjacentHTML('beforeend', `<div class="${this.mainWrapperClass}"></div>`);
            element.insertAdjacentHTML('beforeend', `<div class="${this.imageWrapperClass}"></div>`);

            this.imageWrapper = element.querySelector(`.${this.imageWrapperClass}`) as HTMLDivElement;
            this.mainWrapper = element.querySelector(`.${this.mainWrapperClass}`) as HTMLDivElement;

            this.imageWrapper.classList.add(this.uniq);

            this.setRender();
            this.setImageClick();
            this.setDeleteClick();
            this.setScroll();

            this.update();
        }

        /**
         * Обновить плеер
         */
        public update() : void {

            const self = this;

            Array.from(this.imageWrapper.querySelectorAll('.img')).forEach(function (span : HTMLSpanElement) {
                self.deleteItem(span);
            });

            this.playerElement.querySelectorAll(`img:not(.${this.imageStopClass}):not(.clone)`).forEach(function (image : HTMLImageElement) {
                self.addItem(image);
                image.remove();
            });

            this.images = Array.from(this.imageWrapper.querySelectorAll('.img'));

            let imagesWidth = 0;
            this.images.forEach(function (img : HTMLImageElement) {
                imagesWidth += img.offsetWidth;
            });

            this.imagesWidth = imagesWidth;

            const firstImage : HTMLSpanElement | null = this.imageWrapper.querySelector('.img');
            if (this.activate && firstImage) {
                firstImage.click();
            }
        }

        /**
         * Геттер для уникального идентификатора плеера
         *
         * @returns {string}
         */
        get id() : string {
            return this.uniq;
        }

        /**
         * Добавить изображение в плеер
         *
         * @param {HTMLImageElement} image - изображение
         * @param {boolean} isActivate - активировать добавляемое изображение
         * @param {string} sourceName - ссылка на альтернативный ресурс
         */
        public addItem(image : HTMLImageElement, isActivate : boolean = false, sourceName : string = '') : void {
            if (image.closest('.clone')) {
                return;
            }

            let src : string = decodeURI(image.src),
                span : HTMLSpanElement = Utils.GoodFuncs.createElementWithAttrs(
                    'span',
                    {
                        'class': 'img',
                        'data-src': src,
                        'title': image.title.length > 50 ? image.title.substr(0, 50) + '...' : image.title,
                        'data-object-src': image.dataset.objectSrc,
                        'data-type': image.dataset.type,
                        'html': '<i class="material-icons">close</i>',
                        'data-name': sourceName || image.dataset.name
                    });

            span.style.backgroundImage = `url("${src}")`;

            this.imageWrapper.appendChild(span);
            this.images.push(span);
            this.imagesWidth += span.offsetWidth;

            if (isActivate) {
                span.click();
            }
        }

        /**
         * Удалить пару изображение - ресурс из плеера
         *
         * @param {HTMLSpanElement} element - удаляемый элемент
         */
        public deleteItem(element : HTMLSpanElement) {

            let index = this.images.indexOf(element),
                objSrc : string | undefined = element.dataset.objectSrc || element.dataset.src;

            element.remove();

            for (let object of Array.from(this.mainWrapper.querySelectorAll('img, video, iframe, embed'))) {
                if (object.getAttribute('src') === objSrc) {
                    object.remove();
                }
            }

            this.images.splice(index, 1);
            this.images = this.images.filter(val => val);
            this.imagesWidth -= element.offsetWidth;

            document.dispatchEvent(
                new CustomEvent(
                    'deleteItem',
                    {
                        detail: {
                            src: objSrc,
                            field: element.dataset.name
                        }
                    }
                )
            );
        }
    }
}
