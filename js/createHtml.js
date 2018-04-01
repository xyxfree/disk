// 生成当前文件节点
function createFileNode(fileData){
    const folder = document.createElement('div');
    folder.className = `file`;
    folder.innerHTML = `
    <div class="filechild">
        <div id="checkbox" class="checkbox"></div>
        <div class="file-img"></div>
        <div class="file-name">
            <div class="text show" title="${fileData.name}">${fileData.name}</div>
            <input type="text" class="input">
        </div>
    </div>`;
    
    var addFolderIdItems = folder.querySelectorAll('div');
    
    for(var i=0; i<addFolderIdItems.length; i++){
        addFolderIdItems[i].fileId = fileData.id;
    }
    
    return folder;
  }


  // 生成面包削节点
function createBreadCrumbNode(fileData){
    const item = document.createElement('li');
    const href = document.createElement('a');
    href.fileId = fileData.id;
    href.innerHTML = fileData.name;
    href.href = 'javascript:;';
    item.appendChild(href);
    return item;
  }

// 生成对话框
function createWarningInfo(message){
    const fsAlert = document.createElement('div');
    fsAlert.className = `recycleBin`;
    fsAlert.innerHTML = `<i class="warn"></i>
        <a href="javascript:;" class="cover">X</a>
        <span class="wen">${message}</span>
        <span class="zi">已删除的文件夹可以在回收站找到</span>
        <input class="sure" type="button" value="确定">
        <input class="cancel" type="button" value="取消"> `;
    return fsAlert;
  }

  function createTreeList(db, id = 0, currentListId){
    const data = db[id];
    const floorIndex = getAllParents(db, id).length;
    const children = getChildrenById(db, id);
    const len = children.length;
    
    let str = `<ul>`;
    
    str += `<li>
              <div data-file-id="${data.id}" class="${currentListId === data.id ? 'active' : ''}" style="padding-left: ${(floorIndex-1)*18}px;">
                <i data-file-id="${data.id}" class="triangle-open"></i>
                <span data-file-id="${data.id}" class="name">${data.name}</span>
              </div>`;
    
    if(len){
      for(let i=0; i<len; i++){
        str += createTreeList(db, children[i].id, currentListId);
      }
    }
    
    return str += `</li></ul>`;
  }

  function createFileMoveDialog(treeListHtml){
    const fileMove = document.createElement('div');
    fileMove.classList.add('filemovebox');
    fileMove.innerHTML = `<div class="modal-dialog">
                            <div class="modal-content">
                            <div class="modal-header">
                                 <button type="button" class="close"><span>&times;</span></button>
                                <h4 class="chose" id="chose">选择目标:</h4>
                            </div>
                            <div class="modal">
                               <div class="tree" id="tree">
                                  ${treeListHtml}
                                </div>
                            </div>
                            <div class="footer">
                                <button type="button" class="btn btn-cancel" data-dismiss="modal">取消</button>
                                <button type="button" class="btn btn-sure">确定</button>
                             </div>
                            </div>
                          </div>`;
    return fileMove;
  }