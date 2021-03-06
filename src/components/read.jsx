import React from 'react';
import { Link } from 'react-router-dom'
import {Layout, Spin, message, Icon, Modal} from 'antd';
import styles from '../styles/read.less';
import template from './template';
import 'whatwg-fetch';
import storejs from 'store/dist/store.legacy';

const { Header, Footer } = Layout;
var _ = require('underscore')
class Read extends React.Component{
  constructor(props) {
    super(props);
    this.flag = true; //标记第一次进入， 判断是否读取上一次阅读的scrollTop
    this.pos = this.props.match.params.id; //书籍在列表的序号
    this.index = storejs.get('bookList')[this.pos].readIndex || 0; //章节号
    this.chapterList = storejs.get('bookList')[this.pos].list.chapters;
    this.readSetting = storejs.get('readSetting') || {fontSize: '12', backgroundColor: 'rgb(196, 196 ,196)'};
    this.state = {
      loading: true,
      chapter: '',
      show: false,
      readSetting: this.readSetting,
      chapterListShow: false,
      readSettingShow: false
    }

    this.getChapter = (index) => {
      let chapters = this.props.bookList.list[this.pos].list.chapters;
      if (index < 0) {
        message.info('已经是第一章了！');
        this.index = 0;
        return;
      }
      else if(index >= chapters.length) {
        message.info('已经是最新的一章了！');
        this.index = chapters.length - 1;
        return;
      }
      this.setState({loading: true});
      fetch(`/chapter/${encodeURIComponent(chapters[index].link)}?k=2124b73d7e2e1945&t=1468223717`)
      .then(res => res.json())
      .then( data => {
        if (!data.ok) {
          message.info('章节内容丢失！');
          return this.setState({loading: false});
        }
        let bookList = storejs.get('bookList');
        bookList[this.pos].readIndex = index;
        storejs.set('bookList', bookList);
        let content = _.has(data.chapter, 'cpContent') ?  data.chapter.cpContent :  data.chapter.body;
        data.chapter.cpContent =  '   ' + content.replace(/\n/g, "\n   ");
        this.setState({loading: false, chapter: data.chapter})
      })
      .catch(error => message.info(error))
    }

    this.nextChapter = (e) => {
      e.stopPropagation();
      this.getChapter(++this.index);
    }
    this.preChapter = (e) => {
      e.stopPropagation();
      this.getChapter(--this.index);
    }

    this.targetChapter = (e) => {
      e.stopPropagation();
      this.index = e.target.id
      this.getChapter(this.index);
      this.setState({chapterListShow: false});
    }

    this.shwoSetting = () => {
      this.setState({show: !this.state.show});
    }

    this.fontUp = () => {
      this.readSetting.fontSize++
      this.setState({readSetting: this.readSetting});
      storejs.set('readSetting', this.readSetting);
    }

    this.fontDown = () => {
      if (this.readSetting.fontSize <=12) {
        return;
      }
      this.readSetting.fontSize--
      this.setState({readSetting: this.readSetting});
      storejs.set('readSetting', this.readSetting);
    }

    this.changeBackgroudnColor = (e) => {
      this.readSetting.backgroundColor = e.target.style.backgroundColor;
      this.setState({readSetting: this.readSetting});
      storejs.set('readSetting', this.readSetting);
    }

    this.readScroll = () => {
      let bookList = storejs.get('bookList');
      bookList[this.pos].readScroll = this.refs.box.scrollTop;
      storejs.set('bookList', bookList);
    }

    this.showChapterList = (chapterListShow) => {
      this.setState({ chapterListShow });
    }

    this.downladBook = () => {
      Modal.info({
        title: '提示',
        content: (
          <div>
            <p>服务器配置与带宽有限，目前不支持缓存功能！请在线阅读！谢谢合作！</p>
          </div>
        ),
        onOk() {},
      });
    }

    this.readSettingShowControl = (e) => {
      e.stopPropagation();
      let value = !this.state.readSettingShow;
      this.setState({readSettingShow: value});
    }
  }


  componentWillMount() {
    this.getChapter(this.index);
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.flag) { //加载上次阅读进度
      let bookList = storejs.get('bookList');
      this.refs.box.scrollTop = _.has(bookList[this.pos], 'readScroll') ? bookList[this.pos].readScroll : 0;
      this.flag = false;
    }
    else if(prevState.loading !== this.state.loading){
      this.refs.box.scrollTop = 0;
    }
    let list =  document.querySelector('.chapterList .ant-modal-body');
    if (list !== null) {
      list.scrollTop = 45 * (this.index - 3);
    }
  }


  render() {
    return (
      <Spin className='loading' spinning={this.state.loading} tip="章节内容加载中">
        <Layout >
          <Modal
            className="chapterList"
            title="Vertically centered modal dialog"
            visible={this.state.chapterListShow}
            onOk={() => this.showChapterList(false)}
            onCancel={() => this.showChapterList(false)}
          >
            {
              this.chapterList.map((item,index) => (<p id={index} className={parseInt(this.index, 10) == index ?  'choosed' : ''} onClick={this.targetChapter} key={index}>{item.title}</p>))
            }
          </Modal>
          {
            this.state.show ? (() => {
              return (
                <Header className={styles.header}>
                  <Link to="/"><Icon type="arrow-left" className={styles.pre}/></Link>
                  <Link to={`/changeOrigin/${this.pos}`}><span className={styles.origin}>换源</span></Link>
                </Header>
              )
            })() : ''
          }
          <div ref='box' className={styles.box} style={this.state.readSetting} onClick={this.shwoSetting} onScroll={this.readScroll}>
          {this.state.loading ? '' : (()=>{
            return (
              <div>
                <h1>{this.state.chapter.title}</h1>
                <pre >{this.state.chapter.cpContent}</pre>
                <h1 className={styles.control}>
                  <span onClick={this.preChapter}>上一章</span>
                  <span onClick={this.nextChapter}>下一章</span>
                </h1>
              </div>
            )
          })()}
          </div>
          {
            this.state.show ?  (() => {
              return (
                <Footer className={styles.footer}>
                  <div 
                    className={styles.setting} 
                    tabIndex="100" 
                    onClick={this.readSettingShowControl} 
                    onBlur={this.readSettingShowControl}>
                    <Icon type="setting" /><br/>设置
                    {
                      this.state.readSettingShow ?
                      (
                        <div onClick={(e) => e.stopPropagation()}>
                          <div className={styles.font}>
                            <span onClick={this.fontDown}>Aa -</span>
                            <span onClick={this.fontUp}>Aa +</span>
                          </div>
                          <div className={styles.color}>
                            <i onClick={this.changeBackgroudnColor} style={{backgroundColor: 'rgb(196, 196 ,196)'}}></i>
                            <i onClick={this.changeBackgroudnColor} style={{backgroundColor: 'rgb(162, 157, 137)'}}></i>
                            <i onClick={this.changeBackgroudnColor} style={{backgroundColor: 'rgb(173, 200, 169)'}}></i>
                          </div>
                        </div>
                      ) : ''
                    }
                  </div>
                  <div><Icon type="download"  onClick={this.downladBook}/><br/>下载</div>
                  <div onClick={() => this.showChapterList(true)}><Icon type="bars" /><br/>目录</div>
                </Footer>
              )
            })() : ''
          }
          
        </Layout>
      </Spin>
    )
  }
}

export default template(Read);