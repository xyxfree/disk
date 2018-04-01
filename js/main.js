const wy = {
    filebox: document.getElementById('filebox'),
    content: document.getElementById('content'),
    wrapper: document.getElementById('wrapper'),
    fsItems: document.getElementById('filebox').children,
    list: document.getElementById('list'),
    nav: document.getElementById('nav'),
    checkAll:document.getElementById('checkall'),
    checkbox:document.getElementById('many'),
    reName: document.getElementById('rename'),
    renameprompt: document.getElementById('renameprompt'),
    emptyInfo: document.getElementById('null'),
    funBtns: document.getElementById('list'),
    rmFile: document.getElementById('delete'),
    fsDialog: document.getElementById('recycleBinbox'),
    newDir: document.getElementById('create'),
    moveFile: document.getElementById('move'),
    currentListId: 0,
    moveTargetId: 0,
    checkedBuffer: {length: 0},
    currentBuffer: [],
    parentsBuffer: []
  };

  // 初始化
intoFolder(wy.currentListId);

// 进入新的界面
function intoFolder(currentListId, sort=2){
  initCheckedFiles();
  wy.currentBuffer=createFileList(db, currentListId);
  wy.parentsBuffer =createBreadCrumList(db, currentListId);
  showEmptyInfo();
}

// 生成文件列表
function createFileList(db, id){
    wy.filebox.innerHTML = '';
    let data = getChildrenById(db, id);

    // 按中文首字符的拼音进行排序
    data.sort(function (a, b){
      return a.name[0].localeCompare(b.name[0], 'zh');
    });

    data.forEach(function(item, i) {
        wy.filebox.appendChild(createFileNode(item));
    });
    return data;
  }

// 生成面包削导航
function createBreadCrumList(db, id){
  wy.nav.innerHTML = '';
  var data = getAllParents(db, id);
  data.forEach(function(item, i) {
    wy.nav.appendChild(createBreadCrumbNode(item));
  });
  return data;
}


// 进入文件夹和选中文件夹
wy.filebox.addEventListener('click', function (e){
  const target = e.target;
  if(target.classList.contains('file-img') ||target.classList.contains('filechild')){
    intoFolder(wy.currentListId = target.fileId);
  }
  if(target.classList.contains('checkbox')){
    checkNodeData(target.parentNode);
  }
});

// 面包削导航跳转
wy.nav.addEventListener('click', function (e){
  const target = e.target;
  if(target.fileId !== undefined && wy.currentListId !== target.fileId){
    intoFolder(wy.currentListId = target.fileId);
  }
});


// 单选和全选
function checkNodeData(checkNode){
  const {fileId} = checkNode;
  const checked = checkNode.classList.toggle('active');
  const {checkedBuffer, checkAll, checkbox, fsItems} = wy;
  const len = fsItems.length;
  
  if(checked){
    checkedBuffer[fileId] = checkNode;
    checkedBuffer.length++;
  }else{
    delete checkedBuffer[fileId];
    checkedBuffer.length--;
  }
  
  const checkedLen =checkbox.innerHTML = checkedBuffer.length;

  checkAll.classList.toggle('active', checkedLen === len);
}

// 全选功能
wy.checkAll.addEventListener('click', function (e){
  const isChecked = this.classList.toggle('active');
  toggleCheckAll(isChecked);
});

function initCheckedFiles(){
  if(wy.checkedBuffer.length > 0){
    wy.checkAll.classList.remove('active');
    toggleCheckAll(false);
  }
}

function toggleCheckAll(isChecked){
  const {filebox, checkedBuffer, checkbox, fsItems} = wy;
  
  const len = fsItems.length;
  
  if(isChecked){
    checkedBuffer.length = checkbox.innerHTML = len;
  }else{
    wy.checkedBuffer = {length: 0};
    checkbox.innerHTML = 0;
  }
  
  for(let i=0; i<len; i++){
    const fileItem = fsItems[i].querySelector('.filechild');
    const {fileId} = fileItem;
    fileItem.classList.toggle('active', isChecked);
    if(!checkedBuffer[fileId] && isChecked){
      checkedBuffer[fileId] = fileItem;
    }
  }
} 

//警告框提示功能
function warm(word,color){
    clearTimeout(renameprompt.timer);
    renameprompt.innerHTML=`${word}`;
    renameprompt.style.display='block';
    renameprompt.style.backgroundColor=`${color}`;
    shake({
      el:renameprompt,
      cb(){
        renameprompt.timer = setTimeout(function() {
          renameprompt.innerHTML = '';
        }, 2000);
      }
    });
     
    }

// 重命名功能
wy.reName.addEventListener('click', function (e){
  const {checkedBuffer} = wy;
  const len = checkedBuffer.length;
  
  if(len > 1){
    return warm('只能选中一个文件','red');
  }
  if(!len){
     return warm('尚未选中文件','red');
  }
  setFileItemName(checkedBuffer, true);
});

function setFileItemName(checkedBuffer, showMessage, succFn, failFn){
  const checkedEles = getCheckedFileFromBuffer(checkedBuffer)[0];
  const {fileId, fileNode} = checkedEles;
  
  const nameText = fileNode.querySelector('.text');
  const nameInput = fileNode.querySelector('.input');
  
  dblSetCls(nameInput, nameText, 'show');
  
  const oldName = nameInput.value = nameText.innerHTML;
  nameInput.focus();
  
  nameInput.onblur = function (){
    let newName = this.value.trim();
    if(!newName){
      dblSetCls(nameText, nameInput, 'show');
      this.onblur = null;
      failFn&&failFn();
      return  warm('取消重命名','red');
    }
    if(newName === oldName){
      dblSetCls(nameText, nameInput, 'show');
      this.onblur = null;
      failFn&&failFn();
      return;
    }
    if(!nameCanUse(db, wy.currentListId, newName)){
      this.select();
      return  warm('命名冲突','red');
    }
    nameText.innerHTML = newName;
    dblSetCls(nameText, nameInput, 'show');
    
    setItemById(db, fileId, {name: newName});
    
    warm('命名成功','green');
  
    this.onblur = null;
    succFn&&succFn(newName);
  };
  
  window.onkeyup = function (e){
    if(e.keyCode === 13){
      nameInput.blur();
      this.onkeyup = null;
    }
  };
};

function dblSetCls(show, hidden, cls){
  show.classList.add(cls);
  hidden.classList.remove(cls);
}

// 将选中的元素缓存转成数组
function getCheckedFileFromBuffer(checkedBuffer){
  let data = [];
  for(let key in checkedBuffer){
  if(key !== 'length'){ 
      const currentItem = checkedBuffer[key];
      data.push({
        fileId: parseFloat(key),
        fileNode: currentItem
      });
    }
  }
  return data;
}

// 删除功能
wy.rmFile.addEventListener('click', function (e){
  const {checkedBuffer} = wy;
  const checkedLen = checkedBuffer.length;
  
  if(!checkedLen){
    return warm('未选中任何文件','red');
  }
  setDialog('确定要删除这个文件夹吗?', () => {
    deletFiles(checkedBuffer);
  }, () => {
    return warm('取消删除文件','green');
  });
});

function deletFiles(checkedBuffer){
  const checkedEles = getCheckedFileFromBuffer(checkedBuffer);
  const {filebox} = wy;
  
  checkedEles.forEach(function(item, i) {
    const {fileId, fileNode} = item;
    
    filebox.removeChild(fileNode.parentNode);
    
    wy.checkedBuffer.length--;
    
    // 如果length是0证明没有被选中的了，所以重新赋值为要给新的对象。
    if(!wy.checkedBuffer.length){ 
      wy.checkedBuffer = {length: 0};
    }else{
      delete wy.checkedBuffer[fileId];
    }
    deleteItemById(db, fileId);
  });
  showEmptyInfo();
  warm('删除成功','green');
}

//是否显示目录为空的提示
function showEmptyInfo(){
  wy.emptyInfo.classList.toggle('show', !wy.fsItems.length);
}

// 显示警告框功能
function setDialog(message, sureFn, cancelFn){
  const {fsDialog} = wy;
  const fsAlert = fsDialog.appendChild(createWarningInfo(message));
  
  fsDialog.classList.add('show');
  
  const cover = fsAlert.querySelector('.cover');
  const sureBtn = fsAlert.querySelector('.sure');
  const cancelBtn = fsAlert.querySelector('.cancel');
  
  sureBtn.addEventListener('click', function (e){
    sureFn&&sureFn();
    hideDialog();
  });
  
  cancelBtn.addEventListener('click', function (e){
    cancelFn&&cancelFn();
    hideDialog();
  });

  cover.addEventListener('click', function (e){
    cancelFn&&cancelFn();
    hideDialog();
  });
  
  function hideDialog(){
    fsDialog.classList.remove('show');
    fsDialog.innerHTML = '';
  }
}


// 新建文件夹
wy.newDir.addEventListener('click', function (e){
  initCheckedFiles();
  
  const {currentListId, filebox, checkedBuffer} = wy;
  
  const newFolderData = {
    id: Date.now(),
    name: '',
    pId: wy.currentListId
  };
  
  const newFolderNode = createFileNode(newFolderData);
  
  const fileWrap = newFolderNode.querySelector('.filechild');
  
  filebox.insertBefore(newFolderNode, filebox.firstElementChild);
  
  checkNodeData(fileWrap);
  
  showEmptyInfo();
  
  setFileItemName(
    checkedBuffer,
    false,
    (name) => {
      newFolderData.name = name;
      addOneData(db, newFolderData);
      showEmptyInfo();
      warm('新建操作成功','green');
    },
    () => {
      filebox.removeChild(newFolderNode);
      initCheckedFiles();
      showEmptyInfo();
      warm('取消新建操作','red');
    }
  );
});

// -------------------------------------------------------------------
// 移动文件
wy.moveFile.addEventListener('click', function (e){
  const {checkedBuffer} = wy;
  const len = checkedBuffer.length;
  
  if(!len){
    return warm('尚未选中文件','red');
  }
  
  setMoveFileDialog(sureFn, cancelFn);
  
  function sureFn(){
    const {filebox} = wy;
    const checkedEles = getCheckedFileFromBuffer(checkedBuffer);
    
    let canMove = true;
    
    for(let i=0, len=checkedEles.length; i<len; i++){
      const {fileId, fileNode} = checkedEles[i];
      const ret = canMoveData(db, fileId, wy.moveTargetId);
      if(ret === 2){
        return warm('已经在当前目录','red');
        canMove = false;
      }
      if(ret === 3){
        return warm('不能移动到子集','red');
        canMove = false;
      }
      if(ret === 4){
        return warm('存在同名文件','red');
        canMove = false;
      }
    }
    if(canMove){
      checkedEles.forEach(function(item, i) {
        const {fileId, fileNode} = item;
        moveDataToTarget(db, fileId, wy.moveTargetId);
        filebox.removeChild(fileNode.parentNode);
      });
      initCheckedFiles();
      showEmptyInfo();
    }
  }
  function cancelFn(){
    warm('取消移动文件','greed');
  }
});

function setMoveFileDialog(sureFn, cancelFn){
  const {fsDialog, currentListId} = wy;
  
  const treeListNode = createFileMoveDialog(createTreeList(db, 0, currentListId));
  
  fsDialog.appendChild(treeListNode);
  
  fsDialog.classList.add('show');
  
  const fileMoveWrap = document.querySelector('.filemovebox');
  
  fileMoveWrap.style.left = (fileMoveWrap.parentNode.clientWidth - fileMoveWrap.offsetWidth) / 2 + 'px'; 
  fileMoveWrap.style.top = (fileMoveWrap.parentNode.clientHeight - fileMoveWrap.offsetHeight) / 2 + 'px'; 
  
  dragEle({
    downEle: fsDialog.querySelector('.modal-header'),
    moveEle: fsDialog.querySelector('.filemovebox')
  });
  
  const listTreeItems = document.querySelectorAll('#tree div');
  
  let prevActive = currentListId;
  
  for(let i=0, len=listTreeItems.length; i<len; i++){
    listTreeItems[i].onclick = function (){
      listTreeItems[prevActive].classList.remove('active');
      this.classList.add('active');
      prevActive = i;
      wy.moveTargetId = this.dataset.fileId * 1;
    };
    
    listTreeItems[i].firstElementChild.onclick = function (){
      const allSiblings = [...this.parentNode.parentNode.children].slice(1);
      
      if(allSiblings.length){
        allSiblings.forEach(function(item, i) {
          item.style.display = item.style.display === '' ? 'none' : '';
        });
      }
      this.classList.toggle('triangle-open');
      this.classList.toggle('triangle-close');
    }
  }
  
  const sureBtn = fsDialog.querySelector('.btn-sure');
  const cancelBtn = fsDialog.querySelector('.btn-cancel');
  const closeBtn =fsDialog.querySelector('.close');
  
  sureBtn.onclick = function (){
    sureFn&&sureFn();
    closeTreeList();
  };
  cancelBtn.onclick = closeBtn.onclick = function (e){
    cancelFn&&cancelFn();
    closeTreeList();
  };
  closeBtn.onmousedown = function (e){
    e.stopPropagation();
  };
  
  function closeTreeList(){
    fsDialog.classList.remove('show');
    fsDialog.innerHTML = '';
  }
}

//左侧文字抖动
const left=document.getElementById('left');
const as=left.querySelectorAll('a');
 for (let i = 0; i < as.length; i++) {
    as[i].onclick=function (){
      shake({
        el:this,
        dir:'Y',
        cb(){
          this.style.color='rgb(245, 8, 194)';
        }
      });
    };
 }

//随意换皮肤
  const arr=['image/3.png','image/4.png','image/5.png','image/6.png','image/7.png','image/8.png','image/9.png'];
  const free=document.getElementById('free');
  const {content}=wy;
  free.onclick=function (){
    var num=(~~(Math.random()*10)%7);
    content.style.backgroundImage=`url(${arr[num]})`;
  };

