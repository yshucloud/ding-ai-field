import { FieldType, fieldDecoratorKit, FormItemComponent, FieldExecuteCode, AuthorizationType } from 'dingtalk-docs-cool-app';
const { t } = fieldDecoratorKit;

// 通过addDomainList添加请求接口的域名
fieldDecoratorKit.setDomainList(['ai.ysapi.cloud']);

fieldDecoratorKit.setDecorator({
  name: 'AI 生图(Image 2)',
  // 定义捷径的i18n语言资源
  i18nMap: {
    'zh-CN': {
      'prompt': '生图描述',
      'image': '参考图片',
      'aspect_ratio': '输出尺寸',
      'picType': '输出格式',
    },
    'en-US': {
      'prompt': 'Prompt',
      'image': 'Image',
      'aspect_ratio': 'Aspect Ratio',
      'picType': 'Picture Type',
    },
    'ja-JP': {
      'prompt': 'プロプト',
      'image': '参考画像',
      'aspect_ratio': 'アスペクト比',
      'picType': '画像形式',
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
        placeholder: '请输入生图描述',
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
      key: 'aspect_ratio',
      label: t('aspect_ratio'),
      component: FormItemComponent.SingleSelect,
      props: {
        defaultValue: 'auto',
        placeholder: '请选择图像比例',
        options: [
          { key: 'auto', title: 'auto' },
          { key: '1:1', title: '1:1' },
          { key: '3:2', title: '3:2' },
          { key: '2:3', title: '2:3' },
          { key: '16:9', title: '16:9' },
          { key: '9:16', title: '9:16' },
          { key: '4:3', title: '4:3' },
          { key: '3:4', title: '3:4' },
          { key: '21:9', title: '21:9' },
          { key: '9:21', title: '9:21' },
          { key: '1:3', title: '1:3' },
          { key: '3:1', title: '3:1' },
          { key: '2:1', title: '2:1' },
          { key: '1:2', title: '1:2' }
        ]
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
        placeholder: '请选择输出格式',
        options: [
          { key: 'jpg', title: 'jpg' },
          { key: 'png', title: 'png' },
          { key: 'webp', title: 'webp' },
        ]
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
  const { prompt, image, aspect_ratio, picType } = formItemParams;

  const CONFIG = {
    baseUrl: 'https://ai.ysapi.cloud/v1/images/generations',
    model: 'gpt-image-2',
    maxRetries: 1,
    maxTotalTime: 900000,
  };

  const tmpUrls = image ? image.flatMap(group => group.map(item => item.tmp_url)) : [];

  const buildRequestBody = () => {
    const body = {
      model: CONFIG.model,
      prompt,
      aspect_ratio,
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
