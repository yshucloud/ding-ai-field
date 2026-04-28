import { FieldType, fieldDecoratorKit, FormItemComponent, FieldExecuteCode, AuthorizationType } from 'dingtalk-docs-cool-app';
const { t } = fieldDecoratorKit;

// 通过addDomainList添加请求接口的域名
fieldDecoratorKit.setDomainList(['ai.ysapi.cloud']);

fieldDecoratorKit.setDecorator({
  name: 'AI 视频创作(HappyHourse)',
  // 定义捷径的i18n语言资源
  i18nMap: {
    'zh-CN': {
      'model': '模型选择',
      'prompt': '视频生成描述',
      'image_urls': '参考图片',
      'duration': '视频时长',
      'size': '输出尺寸',
      'promptPrompt': '输入视频生成描述',
    },
    'en-US': {
      'model': 'Model',
      'prompt': 'Prompt',
      'image_urls': 'Image URLs',
      'duration': 'Video Duration',
      'size': 'Output Size',
      'promptPrompt': 'Input the video description',
    },
    'ja-JP': {
      'model': 'モデル',
      'prompt': 'プロプト',
      'image_urls': '参考画像', 
      'duration': '视频時長',
      'size': '出力サイズ',
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
      key: 'model',
      label: t('model'),
      component: FormItemComponent.SingleSelect,
      props: {
        defaultValue: 'happyhorse-1.0-720P',
        placeholder: '选择模型',
        options: [
          { key: 'happyhorse-1.0-720P',title: 'happyhorse-1.0-720P'},
          { key: 'happyhorse-1.0-1080P',title: 'happyhorse-1.0-1080P'},
        ]
      },
      validator: {
        required: true,
      }
    },
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
      key: 'image_urls',
      label: t('image_urls'),
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
      key: 'duration',
      label: t('duration'),
      component: FormItemComponent.SingleSelect,
      props: {
       defaultValue: '5',
        options: [
          { key: '3', title: '3' },
          { key: '4', title: '4' },
          { key: '5', title: '5' },
          { key: '6', title: '6' },
          { key: '7', title: '7' },
          { key: '8', title: '8' },
          { key: '9', title: '9' }, 
          { key: '10', title: '10' },
          { key: '11', title: '11' },
          { key: '12', title: '12' },
          { key: '13', title: '13' },
          { key: '14', title: '14' },
          { key: '15', title: '15' },

        ],
      },
      validator: {
        required: true,
      }
    }, {
      key: 'size',
      label: t('size'),
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
  ],
  // 定义捷径的返回结果类型
  resultType: {
    type: FieldType.Attachment,
  },
  // formItemParams 为运行时传入的字段参数，对应字段配置里的 formItems （如引用的依赖字段）
execute: async (context: any, formItemParams: any) => {
  const { model, prompt, image_urls, size, duration } = formItemParams;

  const CONFIG = {
    baseUrl: 'https://ai.ysapi.cloud/v1/videos',
    model: model,
    maxTotalTime: 900000, // 900秒
    pollInterval: 5000, // 5秒间隔
  };

  const tmpUrls = image_urls ? image_urls.filter(Boolean).flatMap(group => group.map(item => item.tmp_url)) : [];

  const buildRequestBody = () => {
    const body = {
      model: CONFIG.model,
      prompt,
      size,
      resolution: model.split('-')[2],
      duration: Number(duration),
      mark: 1,
    };
    if (tmpUrls.length > 0) {
      (body as any).image_urls = tmpUrls;
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
    console.log(resJson);

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
