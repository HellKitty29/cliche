import React, { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface AddLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: Record<string, string | boolean>) => void;
}

const baseInputClassName =
  'w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

const Field: React.FC<{
  label: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, required, children }) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-medium text-gray-700">
      {required && <span className="mr-1 text-red-500">*</span>}
      {label}
    </label>
    {children}
  </div>
);

const AddLocationModal: React.FC<AddLocationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [isPreselected, setIsPreselected] = useState(true);
  const [isKdcEnabled, setIsKdcEnabled] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/25 p-4 backdrop-blur-[2px]">
      <div className="max-h-[92vh] w-full max-w-[1320px] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <h3 className="text-[18px] font-bold text-gray-900">添加地点</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
          >
            <X size={22} />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 gap-x-6 gap-y-7 md:grid-cols-2 xl:grid-cols-4">
            <Field label="所属公司名称" required>
              <input type="text" placeholder="请输入" className={baseInputClassName} />
            </Field>
            <Field label="受访单位名称" required>
              <input type="text" placeholder="请输入" className={baseInputClassName} />
            </Field>
            <Field label="受访单位编码">
              <input type="text" placeholder="请输入" className={baseInputClassName} />
            </Field>
            <Field label="受访单位所在 省/地区">
              <div className="relative">
                <select className={`${baseInputClassName} appearance-none bg-white pr-10`}>
                  <option value="">请选择</option>
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
            </Field>

            <Field label="受访单位所在 市">
              <div className="relative">
                <select className={`${baseInputClassName} appearance-none bg-white pr-10`}>
                  <option value="">请选择</option>
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
            </Field>
            <Field label="受访单位所在 区">
              <input type="text" placeholder="请输入" className={baseInputClassName} />
            </Field>
            <Field label="受访单位所在 详细地址">
              <input type="text" placeholder="请输入" className={baseInputClassName} />
            </Field>
            <Field label="是否预选" required>
              <div className="flex h-[42px] items-center">
                <button
                  type="button"
                  onClick={() => setIsPreselected((prev) => !prev)}
                  className={`relative h-7 w-[42px] rounded-full transition-colors ${
                    isPreselected ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform ${
                      isPreselected ? 'translate-x-[19px]' : 'translate-x-[3px]'
                    }`}
                  />
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white">
                    {isPreselected ? '是' : ''}
                  </span>
                </button>
              </div>
            </Field>

            <Field label="执行人(邮箱)">
              <div className="relative">
                <select className={`${baseInputClassName} appearance-none gap-x-6 gap-y-7 md:grid-cols-2 xl:grid-cols-4`}>
                  <option value="">KDC</option>
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
            </Field>
            <Field label="最近提交日期">
              <input type="text" placeholder="请选择日期" className={baseInputClassName} />
            </Field>
            <Field label="计划执行日期">
              <input type="text" placeholder="请选择日期" className={baseInputClassName} />
            </Field>
            <Field label="联系人姓名">
              <input type="text" placeholder="请输入" className={baseInputClassName} />
            </Field>

            <Field label="联系人职务">
              <input type="text" placeholder="请输入" className={baseInputClassName} />
            </Field>
            <Field label="联系方式">
              <input type="text" placeholder="请输入" className={baseInputClassName} />
            </Field>
            <Field label="其他信息">
              <input type="text" placeholder="请输入" className={baseInputClassName} />
            </Field>
            <Field label="存货 本年金额">
              <input type="text" placeholder="请输入" className={baseInputClassName} />
            </Field>

            <Field label="存货 上年金额">
              <input type="text" placeholder="请输入" className={baseInputClassName} />
            </Field>
            {/* <Field label="是否启用KDC">
              <div className="flex h-[42px] items-center">
                <button
                  type="button"
                  onClick={() => setIsKdcEnabled((prev) => !prev)}
                  className={`relative h-7 w-[42px] rounded-full transition-colors ${
                    isKdcEnabled ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform ${
                      isKdcEnabled ? 'translate-x-[19px]' : 'translate-x-[3px]'
                    }`}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white">
                    {!isKdcEnabled ? '否' : ''}
                  </span>
                </button>
              </div>
            </Field> */}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() =>
              onConfirm({
                isPreselected,
                isKdcEnabled,
              })
            }
            className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddLocationModal;
