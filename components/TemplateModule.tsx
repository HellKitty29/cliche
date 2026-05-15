
import React, { useState } from 'react';
import { CHAPTER_TEMPLATES, TASK_PARAMETERS, REVISIONS } from '../constants';
import { ChevronDown, ChevronUp, Edit2, Trash2, Eye, Download, Send, CheckCircle } from 'lucide-react';

interface TemplateModuleProps {
  onNext: () => void;
  status: 'draft' | 'submitted' | 'reviewed';
  setStatus: (status: 'draft' | 'submitted' | 'reviewed') => void;
  setReviewInfo: (reviewInfo: { reviewer: string; reviewTime: string } | null) => void;
  setShowUploadHint: (show: boolean)=> void;
}

export const TASK_DETAIL_CHAPTERS = CHAPTER_TEMPLATES.filter((item) =>
  ['39157', '39163', '39159', '39161', '39162'].includes(item.id)
).map((item, index) => ({
  id: item.id,
  order: index + 1,
  templateName: item.name,
  location:
    item.id === '39163'
      ? '上海市静安区南京西路街道南京西路1266号(靠近陕西北路),静安区恒隆广场写字楼(陕西北路南)'
      : '-',
  status: item.id === '39161' || item.id === '39162' ? '未开始' : '已完成',
}));

const formatReviewTime = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}`;

  return `${year}/${month}/${day} ${hours}：${minutes}`;
};

const TemplateModule: React.FC<TemplateModuleProps> = ({ 
  onNext, 
  status, 
  setStatus,
  setReviewInfo,
  setShowUploadHint 
}) => {
  const [paramsExpanded, setParamsExpanded] = useState(true);
  const [historyExpanded, setHistoryExpanded] = useState(false);

  const handleSubmit = () => {
    setStatus('submitted');
  };

  const handleReview = () => {
    setStatus('reviewed');
    setShowUploadHint(true);
    setReviewInfo({
      reviewer: 'Ian, Huang',
      reviewTime: formatReviewTime(new Date()),
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between">
        <h2 className="text-xl font-bold border-l-4 border-blue-600 pl-3">模板管理</h2>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center space-x-2">
            <button className="px-4 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 transition">继承模板</button>
          <button className="px-4 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 transition">模板迁移</button>
          <button className="px-4 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 flex items-center"><Eye size={14} className="mr-1" /> 查看</button>
          <button className="px-4 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 transition">任务预览</button>
          <button className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition">新建章节</button>
          
          
          {/* Submit/Review Cycle */}
          {status === 'draft' && (
            <button 
              onClick={handleSubmit}
              className="px-6 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition flex items-center shadow-sm font-medium"
            >
              提交
            </button>
          )}

          {status === 'submitted' && (
            <button 
              onClick={handleReview}
              className="px-6 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition flex items-center shadow-sm font-medium"
            >
              复核
            </button>
          )}

          {status === 'reviewed' && (
            <div className="px-4 py-1.5 bg-blue-primary text-white rounded text-sm flex items-center cursor-default font-medium shadow-sm">
              <CheckCircle size={14} className="mr-1" /> 已复核
            </div>
          )}

          

          {/* <button className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition">新建章节</button>
          <button className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition">任务预览</button> */}
          </div>
        </div>
      </div>

      {/* Chapter Templates Table */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-gray-700 mb-3">项目章节模板</h3>
        <div className="overflow-x-auto border border-gray-200 rounded shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
              <tr>
                <th className="px-4 py-3">章节模板ID</th>
                <th className="px-4 py-3">项目章节模板名称</th>
                <th className="px-4 py-3">是否需要打卡</th>
                <th className="px-4 py-3">是否需要签字</th>
                <th className="px-4 py-3">标签数量</th>
                <th className="px-4 py-3">额外属性</th>
                <th className="px-4 py-3">来源</th>
                <th className="px-4 py-3">依赖设置</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {CHAPTER_TEMPLATES.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">{item.id}</td>
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3">{item.isCheckin ? '是' : '否'}</td>
                  <td className="px-4 py-3">{item.isSignature ? '是' : '否'}</td>
                  <td className="px-4 py-3 text-blue-600">{item.labelCount}</td>
                  <td className="px-4 py-3">{item.extraAttr}</td>
                  <td className="px-4 py-3">{item.source}</td>
                  <td className="px-4 py-3">{item.dependency}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end space-x-2 text-gray-400">
                      <button className="hover:text-blue-600"><Edit2 size={16} /></button>
                      <button className="hover:text-red-600"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Parameters Section */}
      <div className="mb-8">
        <button 
          onClick={() => setParamsExpanded(!paramsExpanded)}
          className="flex items-center text-sm font-bold text-gray-700 mb-3 hover:text-blue-600"
        >
          任务管理参数表 {paramsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {paramsExpanded && (
          <div className="overflow-x-auto border border-gray-200 rounded shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs font-semibold">
                <tr>
                  <th className="px-4 py-3">序号</th>
                  <th className="px-4 py-3">参数名称</th>
                  <th className="px-4 py-3">列表默认显示</th>
                  <th className="px-4 py-3">参数类型</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {TASK_PARAMETERS.map((p) => (
                  <tr key={p.index}>
                    <td className="px-4 py-3 text-gray-500">{p.index}</td>
                    <td className="px-4 py-3">{p.name}</td>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={p.showInList} readOnly className="h-4 w-4 text-blue-600 rounded border-gray-300" />
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Revision History */}
      <div>
        <button 
          onClick={() => setHistoryExpanded(!historyExpanded)}
          className="flex items-center text-sm font-bold text-gray-700 mb-3 hover:text-blue-600"
        >
          复核及修订记录 {historyExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {historyExpanded && (
          <div className="overflow-x-auto border border-gray-200 rounded shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs font-semibold">
                <tr>
                  <th className="px-4 py-3">修订内容</th>
                  <th className="px-4 py-3">提交人</th>
                  <th className="px-4 py-3">复核人</th>
                  <th className="px-4 py-3">复核通过时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {REVISIONS.map((r, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 text-blue-600 underline cursor-pointer">{r.content}</td>
                    <td className="px-4 py-3">{r.submitter}</td>
                    <td className="px-4 py-3">{r.reviewer}</td>
                    <td className="px-4 py-3 text-gray-500">{r.reviewTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateModule;
