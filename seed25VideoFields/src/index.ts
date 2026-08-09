import { FieldType, fieldDecoratorKit, FormItemComponent, FieldExecuteCode, AuthorizationType } from 'dingtalk-docs-cool-app';
const { t } = fieldDecoratorKit;

// 通过addDomainList添加请求接口的域名
fieldDecoratorKit.setDomainList(['ai.ysapi.cloud']);

fieldDecoratorKit.setDecorator({
  name: 'AI 视频创作(seedance 2.5)',
  // 定义捷径的i18n语言资源
  i18nMap: {
    'zh-CN': {
      'model': '模型选择',
      'resolution': '输出分辨率',
      'prompt': '视频生成描述',
      'images': '参考图片',
      'videos': '参考视频',
      'audios': '参考音频',
      'ratio': '输出尺寸',
      'duration': '视频时长',
      'promptPrompt': '输入视频生成描述',
    },
    'en-US': {
      'model': 'Model',
      'resolution': 'Resolution',
      'prompt': 'Prompt',
      'images': 'Image',
      'videos': 'Videos',
      'audios': 'Audios',
      'ratio': 'Ratio',
      'duration': 'Video Duration',
      'promptPrompt': 'Input the video description',
    },
    'ja-JP': {
      'model': 'モデル',
      'resolution': '解像度',
      'images': 'プロプト',
      'image': '参考画像',
      'videos': '参考動画',
      'audios': '参考音声',
      'ratio': 'アスペクト比',
      'duration': '動画の時長',
      'promptPrompt': '動画の説明を入力してください',
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
        defaultValue: 'seedance-2-5',
        placeholder: '选择模型',
        options: [
          { key: 'seedance-2-5',title: 'seedance-2-5'},
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
      key: 'images',
      label: t('images'),
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
      key: 'videos',
      label: t('videos'),
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
      key: 'audios',
      label: t('audios'),
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
      key: 'resolution',
      label: t('resolution'),
      component: FormItemComponent.SingleSelect,
      props: {
        defaultValue: '720p',
        options: [
          { key: '720p', title: '720p' },
          { key: '480p', title: '480p' },
        ],
      },
      validator: {
        required: true,
      }
    },
    {
      key: 'ratio',
      label: t('ratio'),
      component: FormItemComponent.SingleSelect,
      props: {
        defaultValue: 'adaptive',
        options: [
        { key: 'adaptive', title: 'adaptive' },
        { key: '9:16', title: '9:16' },
        { key: '16:9', title: '16:9' },
        { key: '1:1', title: '1:1' },
        { key: '4:3', title: '4:3' },
        { key: '3:4', title: '3:4' },
        { key: '21:9', title: '21:9' }
        ],
      },
      validator: {
        required: true,
      }
    },
    {
      key: 'duration',
      label: t('duration'),
      component: FormItemComponent.SingleSelect,
      props: {
       defaultValue: '4',
        options: [
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
          { key: '16', title: '16' },
          { key: '17', title: '17' },
          { key: '18', title: '18' },
          { key: '19', title: '19' },
          { key: '20', title: '20' },
          { key: '21', title: '21' },
          { key: '22', title: '22' },
          { key: '23', title: '23' },
          { key: '24', title: '24' },
          { key: '25', title: '25' },
          { key: '26', title: '26' },
          { key: '27', title: '27' },
          { key: '28', title: '28' },
          { key: '29', title: '29' },
          { key: '30', title: '30' }
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
  const { model, prompt,duration, resolution, images, videos, audios, ratio } = formItemParams;

  const CONFIG = { baseUrl: 'https://ai.ysapi.cloud/v1/videos', maxTotalTime: 900000, pollInterval: 5000 };

  const requestBody: any = {
    model,
    prompt,
    metadata: {
      ratio,
      duration: Number(duration),
      resolution,
    },
  };

  const collectAttachmentUrls = (attachments: any, maxCount: number): string[] =>
    (Array.isArray(attachments) ? attachments.flat() : [])
      .map(item => item?.tmp_url?.trim().replace(/^`|`$/g, ''))
      .filter(Boolean)
      .slice(0, maxCount);

  // 收集各种附件URL
  const imageUrls = collectAttachmentUrls(images, 9);
  const videoUrls = collectAttachmentUrls(videos, 3);
  const audioUrls = collectAttachmentUrls(audios, 3);

  ([
    ['images', imageUrls],
    ['videos', videoUrls],
    ['audios', audioUrls],
  ] as const).forEach(([key, urls]) => {
    if (urls.length) requestBody[key] = urls;
  });

  const questBody = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  };

  const startTime = Date.now();
  let lastError = null;

  try {
    // 1. 先POST获取task_id
    const res = await context.fetch(CONFIG.baseUrl, questBody, 'auth_id');
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
        throw new Error(pollResJson.error.message);
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
