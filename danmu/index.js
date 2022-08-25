// ==UserScript==
// @name        my_danmu
// @namespace   Violentmonkey Scripts
// @match       https://ddys2.me/*
// @grant       none
// @version     1.0
// @author      -
// @description 2022/8/25 13:52:48
// @require     https://cdn.jsdelivr.net/npm/axios@0.27.2/dist/axios.min.js
// @grant       GM_notification
// @require     https://cdn.jsdelivr.net/npm/danmaku@2.0.4/dist/danmaku.min.js
// ==/UserScript==

const init = async () => {

    const utils = {
        addCss(str_css) {
            var style = document.createElement("style");
            style.textContent = str_css;
            document.getElementsByTagName("head").item(0).appendChild(style);
        },
        getParam(name) {
            var search = document.location.search;
            //alert(search);
            var pattern = new RegExp("[?&]" + name + "\=([^&]+)", "g");
            var matcher = pattern.exec(search);
            var items = null;
            if (null != matcher) {
                try {
                    items = decodeURIComponent(decodeURIComponent(matcher[1]));
                } catch (e) {
                    try {
                        items = decodeURIComponent(matcher[1]);
                    } catch (e) {
                        items = matcher[1];
                    }
                }
            }
            return items;
        },
        async getDanmu(keyword, epindex) {
            try {
                const reSearch = await axios.get('https://api.rr.tv/search/new/multiple', {
                    headers: {
                        clientVersion: '5.19.2',
                        clienttype: 'android_XiaoMi'
                    },
                    params: {
                        keywords: keyword
                    }
                })
                const dramaId = reSearch.data.data.seasonList[0].id;
                // debugger;
                const reDetail = await axios.get('https://api.rr.tv/drama/detail', {
                    headers: {
                        clientVersion: '5.19.2',
                        clienttype: 'android_XiaoMi'
                    },
                    params: {
                        isAgeLimit: false,
                        dramaId
                    }
                })

                const episodeId = reDetail.data.data.episodeList.find(ep => ep.episodeNo == epindex).id

                const reDms = await axios.get(`https://static-dm.rr.tv/v1/produce/danmu/EPISODE/${episodeId}`, {
                    headers: {
                        clientVersion: '5.19.2',
                        clienttype: 'android_XiaoMi'
                    }
                })

                let dms = reDms.data;

                // 格式化弹幕
                let res = (dms).map((it, index) => {
                    const pobj = it.p.split(',')
                    return {
                        id: 'rr_' + index,
                        text: it.d,
                        time: pobj[0],
                        style: {
                            fontSize: '20px',
                            color: '#ffffff'
                        },
                    }
                })

                // 重新排序
                res = res.sort((a, b) => a.time - b.time);

                return res
            } catch (error) {
                console.error(error.message)
                // GM_notification('[my_danmu]' + '暂无弹幕')
                return []
            }
        }
    }


    const initDm = async () => {

        const names = document.querySelector('.cute').textContent.split(' ');
        const name = names[0] + names[1];

        const ep = utils.getParam('ep');
        const episode = Number(ep && ep != 0 ? ep : 1);
        const dms = await utils.getDanmu(name, episode);

        const videoEl = document.querySelector('video');

        const videoWrapEl = videoEl.parentElement;

        // 容器样式
        const classStr = `.videoWrapEl{position:absolute;top:0;left:0;right:0;height:${videoWrapEl.clientHeight / 2}px;line-height:1.2em;} .videoWrapEl div {
        line-height:30px;
    }`;

        utils.addCss(classStr)

        const dmWrapEl = document.createElement('div')
        dmWrapEl.classList.add('videoWrapEl')

        videoWrapEl.append(dmWrapEl)


        var danmaku = new Danmaku({
            container: dmWrapEl,
            media: videoEl,
            comments: dms,
            // engine: 'canvas',
        });


        // danmaku.show();

        // 窗口大小改变重置弹幕
        window.addEventListener('resize', () => {
            danmaku.resize();
        })
    }

    initDm();

}


init();