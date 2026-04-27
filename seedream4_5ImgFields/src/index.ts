import { FieldType, fieldDecoratorKit, FormItemComponent, FieldExecuteCode, AuthorizationType } from 'dingtalk-docs-cool-app';
const { t } = fieldDecoratorKit;

// 通过addDomainList添加请求接口的域名
fieldDecoratorKit.setDomainList(['ai.ysapi.cloud']);

fieldDecoratorKit.setDecorator({
  name: 'AI 图片创作(Seedream 4.5)',
  // 定义捷径的i18n语言资源
  i18nMap: {
    'zh-CN': {
      'prompt': '生图描述',
      'image': '参考图片',
      'size': '输出尺寸',
      'picType': '输出格式',
      'promptPrompt': '输入生图描述',
    },
    'en-US': {
      'model': 'Model',
      'prompt': 'Prompt',
      'image': 'Image',
      'size': 'Size',
      'picType': 'Picture Type',
      'promptPrompt': 'Input the image description',
    },
    'ja-JP': {
      'model': 'モデル',
      'prompt': 'プロプト',
      'image': '参考画像',
      'size': 'サイズ',
      'picType': '画像形式',
      'promptPrompt': '画像の説明を入力してください',
    },
  },
  errorMessages: {},
  authorizations: {
    id: 'auth_id',
    platform: 'ysapi',
    type: AuthorizationType.HeaderBearerToken,
    required: true,
    instructionsUrl: 'https://ai.ysapi.cloud/',
    label: '关联账号',
    tooltips: '请配置授权',
    icon: {
      light: 'https://lsky.zhongzhuan.chat/i/2026/01/31/697e1d1092174.png',
      dark: 'https://lsky.zhongzhuan.chat/i/2026/01/31/697e1d1092174.png',
    },
  },
  // 定义捷径的入参
  formItems: [
   
    {
      key: 'prompt',
      label: t('prompt'),
      component: FormItemComponent.Textarea,
      props: {
        placeholder: t('promptPrompt'),
        enableFieldReference: true,
      },
      validator: {
        required: true,
      }
    },
    {
      key: 'image',
      label: t('image'),
      component: FormItemComponent.FieldSelect,
      props: {
        mode: 'multiple',
        supportTypes: [FieldType.Attachment],
      },
      validator: {
        required: false,
      }
    },
    {
      key: 'size',
      label: t('size'),
      component: FormItemComponent.SingleSelect,
      props: {
        defaultValue: 'auto',
        options: [
        { key:"2048X2048", title:"2K (1:1 2048X2048)"},
        { key:"2304X1728", title:"2K (4:3 2304X1728)"},
        { key:"1728X2304", title:"2K (3:4 1728X2304)"},
        { key:"2848X1600", title:"2K (16:9 2848X1600)"},
        { key:"1600X2848", title:"2K (9:16 1600X2848)"},
        { key:"2496X1664", title:"2K (3:2 2496X1664)"},
        { key:"1664X2496", title:"2K (2:3 1664X2496)"},
        { key:"3136X1344", title:"2K (21:9 3136X1344)"},
        { key:"4096X4096", title:"4K (1:1 4096X4096)"},
        { key:"3520X4704", title:"4K (3:4 3520X4704)"},
        { key:"4704X3520", title:"4K (4:3 4704X3520)"},
        { key:"5504X3040", title:"4K (16:9 5504X3040)"},
        { key:"3040X5504", title:"4K (9:16 3040X5504)"},
        { key:"3328X4992", title:"4K (2:3 3328X4992)"},
        { key:"4992X3328", title:"4K (3:2 4992X3328)"},
        { key:"6240X2656", title:"4K (21:9 6240X2656)"}
        ],
      },
      validator: {
        required: true,
      }
    },
    {
      key: 'picType',
      label: t('picType'),
      component: FormItemComponent.SingleSelect,
      props: {
        defaultValue: 'png',
        options: [
          { key: 'jpg', title: 'jpg' },
          { key: 'png', title: 'png' },
          { key: 'webp', title: 'webp' },
        ],
      },
      validator: {
        required: true,
      }
    },
  ],
  // 定义捷径的返回结果类型
  resultType: {
    type: FieldType.Attachment,
  },
  // formItemParams 为运行时传入的字段参数，对应字段配置里的 formItems （如引用的依赖字段）
execute: async (context: any, formItemParams: any) => {
  const {  prompt, image, size, picType } = formItemParams;

  const CONFIG = {
    baseUrl: 'https://ai.ysapi.cloud/v1/images/generations',
    model:'doubao-seedream-4-5-251128',
    maxRetries: 2,
    maxTotalTime: 900000,
  };

  const tmpUrls = image ? image.filter(Boolean).flatMap(group => group.map(item => item.tmp_url)) : [];

  const buildRequestBody = () => {
    const body = {
      model: CONFIG.model,
      prompt,
      size,
      picType,
      mark: 1,
    };
    if (tmpUrls.length > 0) {
      (body as any).image = tmpUrls;
    }
    return body;
  };

  const requestBody = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildRequestBody()),
  };

  console.log(buildRequestBody());
  
  const startTime = Date.now();
  let lastError = null;

  for (let retry = 0; retry <= CONFIG.maxRetries; retry++) {
    if (Date.now() - startTime >= CONFIG.maxTotalTime) {
      break;
    }

    try {
      const res = await context.fetch(CONFIG.baseUrl, requestBody, 'auth_id');
      const resJson = await res.json();

      if (resJson.error) {
        lastError = new Error(resJson.error.message);
        if (retry < CONFIG.maxRetries) continue;
        throw lastError;
      }

      return {
        code: FieldExecuteCode.Success,
        data: [{
          fileName: `image.${picType}`,
          type: 'image',
          url: resJson.data[0].url,
        }],
      };
    } catch (error) {
      lastError = error;
      if (retry < CONFIG.maxRetries) continue;
    }
  }

  const errmsg = String(lastError);

  if (errmsg.includes('额度')) {
    return { code: FieldExecuteCode.QuotaExhausted };
  }
  if (errmsg.includes('令牌')) {
    return { code: FieldExecuteCode.AuthorizationError };
  }
  

  return { code: FieldExecuteCode.Error, extra: { errmsg } };
},
});

export default fieldDecoratorKit;
