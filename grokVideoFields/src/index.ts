import { FieldType, fieldDecoratorKit, FormItemComponent, FieldExecuteCode, AuthorizationType } from 'dingtalk-docs-cool-app';
const { t } = fieldDecoratorKit;

// 通过addDomainList添加请求接口的域名
fieldDecoratorKit.setDomainList(['ai.ysapi.cloud']);

fieldDecoratorKit.setDecorator({
  name: 'AI 生成视频(Grok 3)',
  // 定义捷径的i18n语言资源
  i18nMap: {
    'zh-CN': {
      'prompt': '视频生成描述',
      'image': '参考图片',
      'aspect_ratio': '输出尺寸',
      'second': '视频时长',
      'promptPrompt': '输入视频生成描述',
    },
    'en-US': {
      'prompt': 'Prompt',
      'image': 'Image',
      'aspect_ratio': 'Aspect Ratio',
      'second': 'Video Duration',
      'promptPrompt': 'Input the video description',
    },
    'ja-JP': {
      'prompt': 'プロプト',
      'image': '参考画像',
      'aspect_ratio': 'アスペクト比',
      'second': '视频時長',
      'promptPrompt': '视频の説明を入力してください',
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
      key: 'aspect_ratio',
      label: t('aspect_ratio'),
      component: FormItemComponent.SingleSelect,
      props: {
        defaultValue: '1:1',
        options: [
          { key: '1:1', title: '1:1' },
          { key: '9:16', title: '9:16' },
          { key: '16:9', title: '16:9' },
          { key: '2:3', title: '2:3' },
          { key: '3:2', title: '3:2' },
        ],
      },
      validator: {
        required: true,
      }
    },
    {
      key: 'second',
      label: t('second'),
      component: FormItemComponent.SingleSelect,
      props: {
       defaultValue: '10s',
        options: [
          { key: '6s', title: '6s' },
          { key: '10s', title: '10s' },
          { key: '15s', title: '15s' },
          { key: '20s', title: '20s' },
          { key: '30s', title: '30s' },
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
  const { prompt, image, aspect_ratio, second } = formItemParams;

  const CONFIG = {
    baseUrl: 'https://ai.ysapi.cloud/v1/videos',
    model:  second === '6s' ? 'grok-video-3' : 'grok-video-3-'+second,
    maxTotalTime: 900000, // 900秒
    pollInterval: 5000, // 5秒间隔
  };

  const tmpUrls = image ? image.filter(Boolean).flatMap(group => group.map(item => item.tmp_url)) : [];

  const buildRequestBody = () => {
    const body = {
      model: CONFIG.model,
      prompt,
      aspect_ratio,
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

  try {
    // 1. 先POST获取task_id
    const res = await context.fetch(CONFIG.baseUrl, requestBody, 'auth_id');
    const resJson = await res.json();    

    if (resJson.error) {
      throw new Error(resJson.error.message);
    }

    const taskId = resJson.id;
    console.log('获取到task_id:', taskId);

    // 2. GET轮询结果
    const pollUrl = `${CONFIG.baseUrl}/${taskId}`;
    const pollRequest = {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    };

    while (Date.now() - startTime < CONFIG.maxTotalTime) {
      const pollRes = await context.fetch(pollUrl, pollRequest, 'auth_id');
      const pollResJson = await pollRes.json();

      if (pollResJson.status === 'failed') {
        throw new Error(pollResJson.fail_reason);
      }

      // 检查是否完成
      if (pollResJson.status === 'completed') {
        return {
          code: FieldExecuteCode.Success, // 0 表示请求成功
          // data 类型需与下方 resultType 定义一致
          data: [{
            fileName: `${taskId}.mp4`,
            type: 'video',
            url: pollResJson.video_url,
          }],
        };
      }

      // 间隔5秒
      await new Promise(resolve => setTimeout(resolve, CONFIG.pollInterval));
    }

    // 超时
    throw new Error('请求超时');
  } catch (error) {
    lastError = error;
  }

  const errmsg = String(lastError);
  console.log(errmsg);

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
