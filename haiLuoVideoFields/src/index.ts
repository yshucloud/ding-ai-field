import { FieldType, fieldDecoratorKit, FormItemComponent, FieldExecuteCode, AuthorizationType } from 'dingtalk-docs-cool-app';
const { t } = fieldDecoratorKit;

// 通过addDomainList添加请求接口的域名
fieldDecoratorKit.setDomainList(['ai.ysapi.cloud']);

fieldDecoratorKit.setDecorator({
  name: 'AI 生成视频(海螺)',
  // 定义捷径的i18n语言资源
  i18nMap: {
    'zh-CN': {
      'model': '模型选择',
      'prompt': '视频生成描述',
      'image': '参考图片',
      'duration': '视频时长',
      'promptPrompt': '输入视频生成描述',
      'first_frame_image': '第一帧图片',
      'last_frame_image': '最后一帧图片',
    },
    'en-US': {
      'model': 'Model',
      'prompt': 'Prompt',
      'image': 'Image',
      'duration': 'Video Duration',
      'promptPrompt': 'Input the video description',
      'first_frame_image': 'First Frame Image',
      'last_frame_image': 'Last Frame Image',
    },
    'ja-JP': {
      'model': 'モデル',
      'prompt': 'プロプト',
      'image': '参考画像',
      'duration': '视频時長',
      'promptPrompt': '视频の説明を入力してください',
      'first_frame_image': '第一フレ画像',
      'last_frame_image': '最終フレーム画像を入力してください',
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
        defaultValue: 'MiniMax-Hailuo-2.3',
        placeholder: '选择模型',
        options: [
          { key: 'MiniMax-Hailuo-2.3',title: 'MiniMax-Hailuo-2.3'},
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
      key: 'first_frame_image',
      label: t('first_frame_image'),
      component: FormItemComponent.FieldSelect,
      props: {
        mode: 'single',
        supportTypes: [FieldType.Attachment],
      },
      validator: {
        required: false,
      }
    },{
      key: 'last_frame_image',
      label: t('last_frame_image'),
      component: FormItemComponent.FieldSelect,
      props: {
        mode: 'single',
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
       defaultValue: '6',
        options: [
          { key: '6', title: '6' },
          { key: '10', title: '10' },
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
  const { model, prompt, duration, first_frame_image, last_frame_image } = formItemParams;

  const CONFIG = {
    baseUrl: 'https://ai.ysapi.cloud/v1/videos',
    model: model ,
    maxTotalTime: 900000, // 900秒
    pollInterval: 5000, // 5秒间隔
  };


  const buildRequestBody = () => {
    const body: any = {
      model: CONFIG.model,
      prompt,
      duration: Number(duration),
      mark: 1,
    };

    if (first_frame_image) {
      body.first_frame_image = first_frame_image[0].tmp_url;
    }
    if (last_frame_image) {
      body.last_frame_image = last_frame_image[0].tmp_url;
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
