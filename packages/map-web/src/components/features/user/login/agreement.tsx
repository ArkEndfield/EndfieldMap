import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';

import { Dialog } from '@/components/common/dialog';
import { type LinkButtonProps } from '@/const/schema/auth';

export interface AgreementDialogProps {
  open: boolean;
  onClose: () => void;
  type: 'agreement' | 'privacy';
}

const AgreementContent = observer(({ type }: { type: 'agreement' | 'privacy' }) => {
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash) {
        const element = document.querySelector(hash);
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (type === 'agreement') {
    return <UserAgreementContent />;
  }
  return <PrivacyPolicyContent />;
});

const UserAgreementContent = () => (
  <div className="p-6 text-sm text-gray-800 leading-relaxed max-h-96 overflow-y-auto">
    <section className="mb-6">
      <h2 className="text-lg font-bold text-gray-900 mb-2">一、总则</h2>
      <h3 className="font-semibold mb-2">1.1 协议的接受</h3>
      <p className="mb-3 pl-4">
        欢迎使用本产品（以下简称"本产品"或"我们"）。当您注册、登录或使用本产品时，即表示您已充分阅读、理解并接受本《用户使用协议》（以下简称"本协议"）的全部内容。
      </p>
      <h3 className="font-semibold mb-2">1.2 协议的生效与修改</h3>
      <p className="mb-3 pl-4">
        本协议自您点击同意或实际使用本产品之日起生效。我们有权根据法律法规变化或产品运营需要，对本协议进行修改。修改后的协议将在产品内公告，如您继续使用本产品，即视为您同意修改后的协议。
      </p>
    </section>

    <section className="mb-6" id="account-usage">
      <h2 className="text-lg font-bold text-gray-900 mb-2">二、账号使用规范</h2>
      <h3 className="font-semibold mb-2">2.1 账号注册</h3>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>您应按照注册页面提示提供真实、准确、完整的个人资料，并对您的注册信息和资料的安全性负责。</li>
        <li>账号注册完成后，您对本账号的登录密码、操作行为等一切行为均承担法律责任。</li>
        <li>我们有权对用户提交的注册信息进行审核，如发现信息虚假、违法或违反本协议，有权拒绝注册或暂停使用。</li>
      </ul>
      <h3 className="font-semibold mb-2">2.2 账号使用</h3>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>您不得以任何形式转让、出售、出借或与他人共享您的账号。</li>
        <li>您有责任妥善保管您的账号及密码，因密码保管不善而导致的损失，由您自行承担。</li>
        <li>如发现账号被盗或存在安全漏洞，应立即通知我们，我们将采取必要措施。</li>
      </ul>
      <h3 className="font-semibold mb-2">2.3 账号注销</h3>
      <p className="mb-3 pl-4">
        您有权申请注销您的账号。注销后，您的个人信息将被删除或匿名化处理，且无法恢复。
      </p>
    </section>

    <section className="mb-6" id="user-rights">
      <h2 className="text-lg font-bold text-gray-900 mb-2">三、用户权利与义务</h2>
      <h3 className="font-semibold mb-2">3.1 用户权利</h3>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>有权使用本产品提供的各项功能和服务。</li>
        <li>有权对本产品提出建议、意见或投诉。</li>
        <li>有权查阅、更正、补充、删除其个人信息，或撤回同意授权。</li>
        <li>有权注销其账号并终止使用本产品。</li>
      </ul>
      <h3 className="font-semibold mb-2">3.2 用户义务</h3>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>遵守本协议及相关法律法规，不得利用本产品从事违法活动。</li>
        <li>不得恶意攻击、干扰或破坏本产品系统的正常运行。</li>
        <li>不得利用本产品侵害他人合法权益，包括但不限于知识产权、名誉权、隐私权等。</li>
        <li>不得发布、传播违法违规信息，包括但不限于涉及暴力、色情、诈骗、赌博等内容。</li>
      </ul>
    </section>

    <section className="mb-6" id="liability">
      <h2 className="text-lg font-bold text-gray-900 mb-2">四、责任条款</h2>
      <h3 className="font-semibold mb-2">4.1 用户责任</h3>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>您因违反本协议而给任何第三方或我们造成损失的，应承担相应的赔偿责任。</li>
        <li>您应对您使用本产品时发布的内容承担全部责任。</li>
        <li>如您的账号被他人非法使用，由您自行承担由此产生的全部责任。</li>
      </ul>
      <h3 className="font-semibold mb-2">4.2 平台责任</h3>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>我们承诺保障产品服务的稳定运行，但不保证服务不中断或不出现任何错误。</li>
        <li>我们不对因不可抗力、网络故障、计算机病毒、黑客攻击等原因导致的服务中断或数据损失承担责任。</li>
        <li>我们有权根据运营需要，调整、升级或暂停部分功能和服务。</li>
      </ul>
    </section>

    <section className="mb-6" id="disclaimer">
      <h2 className="text-lg font-bold text-gray-900 mb-2">五、免责声明</h2>
      <h3 className="font-semibold mb-2">5.1 服务性质</h3>
      <p className="mb-3 pl-4">
        本产品提供的服务"按原样"提供，不包含任何明示或暗示的保证，包括但不限于对适销性、特定用途适用性、非侵权性的保证。
      </p>
      <h3 className="font-semibold mb-2">5.2 第三方链接</h3>
      <p className="mb-3 pl-4">
        本产品可能包含指向第三方网站或资源的链接。这些第三方网站或资源不在我们的控制范围内，我们不对这些第三方网站或资源的内容或可用性承担责任。
      </p>
      <h3 className="font-semibold mb-2">5.3 损失责任</h3>
      <p className="mb-3 pl-4">
        在任何情况下，我们都不对任何直接、间接、偶然、特殊或后果性的损害（包括但不限于利润损失、数据丢失、业务中断）承担责任，无论责任形式是合同责任、侵权责任还是其他责任。
      </p>
    </section>

    <section className="mb-6" id="dispute-resolution">
      <h2 className="text-lg font-bold text-gray-900 mb-2">六、争议解决</h2>
      <h3 className="font-semibold mb-2">6.1 适用法律</h3>
      <p className="mb-3 pl-4">
        本协议的订立、执行、解释及争议解决均适用中华人民共和国法律法规。
      </p>
      <h3 className="font-semibold mb-2">6.2 争议解决方式</h3>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>凡因本协议引起的或与本协议有关的任何争议，双方应友好协商解决。</li>
        <li>协商不成的，任何一方均有权将争议提交至本产品所在地有管辖权的人民法院诉讼解决。</li>
      </ul>
      <h3 className="font-semibold mb-2">6.3 条款可分性</h3>
      <p className="mb-3 pl-4">
        如本协议的任何条款被认定为无效或不可执行，不影响其他条款的效力，其余条款仍然有效并具有法律约束力。
      </p>
    </section>

    <section className="mb-6">
      <h2 className="text-lg font-bold text-gray-900 mb-2">七、附则</h2>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>本协议的标题仅为方便阅读而设，不影响本协议任何条款的含义或解释。</li>
        <li>我们未行使或延迟行使本协议项下的任何权利或规定，不应被视为对该权利或规定的放弃。</li>
        <li>如对本协议有任何疑问，请通过本产品提供的联系方式与我们联系。</li>
      </ul>
      <p className="mt-4 text-xs text-gray-500">最后更新日期：2026年2月18日</p>
    </section>
  </div>
);

const PrivacyPolicyContent = () => (
  <div className="p-6 text-sm text-gray-800 leading-relaxed max-h-96 overflow-y-auto">
    <section className="mb-6">
      <h2 className="text-lg font-bold text-gray-900 mb-2">一、引言</h2>
      <p className="mb-3 pl-4">
        欢迎使用本产品。我们深知个人信息对您的重要性，并会尽全力保护您的个人信息安全可靠。本《隐私政策》将向您说明我们如何收集、使用、存储和保护您的个人信息，以及您享有的相关权利。
      </p>
      <p className="mb-3 pl-4">
        使用本产品即表示您同意本隐私政策所述内容。如果您不同意本隐私政策的任何内容，请停止使用本产品。
      </p>
    </section>

    <section className="mb-6" id="data-collection">
      <h2 className="text-lg font-bold text-gray-900 mb-2">二、数据收集范围</h2>
      <h3 className="font-semibold mb-2">2.1 主动收集的信息</h3>
      <p className="mb-2 pl-4 font-medium">账号信息：</p>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>注册时提供的用户名、密码等账号信息。</li>
        <li>您主动提供的个人资料，如昵称、头像等。</li>
      </ul>
      <p className="mb-2 pl-4 font-medium">使用信息：</p>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>产品使用记录，包括登录时间、操作行为等。</li>
        <li>功能使用情况，如使用频率、偏好设置等。</li>
      </ul>
      <h3 className="font-semibold mb-2">2.2 自动收集的信息</h3>
      <p className="mb-2 pl-4 font-medium">设备信息：</p>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>设备型号、操作系统版本、浏览器类型等。</li>
        <li>设备标识符（如IMEI、MAC地址等）。</li>
      </ul>
      <p className="mb-2 pl-4 font-medium">网络信息：</p>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>IP地址、网络服务提供商信息。</li>
        <li>访问日期和时间、访问来源等日志信息。</li>
      </ul>
      <h3 className="font-semibold mb-2">2.3 第三方提供的信息</h3>
      <p className="mb-3 pl-4">
        在您授权的情况下，我们可能从第三方合作伙伴处获取您的相关信息，如社交平台账号信息等。
      </p>
    </section>

    <section className="mb-6" id="data-usage">
      <h2 className="text-lg font-bold text-gray-900 mb-2">三、数据使用目的</h2>
      <h3 className="font-semibold mb-2">3.1 服务提供</h3>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>向您提供、维护、改进本产品的各项功能和服务。</li>
        <li>处理您的注册、登录、身份验证等请求。</li>
        <li>保存您的个性化设置和偏好。</li>
      </ul>
      <h3 className="font-semibold mb-2">3.2 安全保障</h3>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>验证您的身份，防范账号被盗用、欺诈等安全风险。</li>
        <li>检测、预防、调查欺诈行为、安全漏洞和违法行为。</li>
        <li>保障本产品及相关服务的安全稳定运行。</li>
      </ul>
      <h3 className="font-semibold mb-2">3.3 产品优化</h3>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>分析产品使用情况，优化产品功能和用户体验。</li>
        <li>开展数据统计分析，了解用户需求和使用习惯。</li>
        <li>开发新产品、新功能或改进现有产品和服务。</li>
      </ul>
      <h3 className="font-semibold mb-2">3.4 沟通联系</h3>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>向您发送服务通知、产品更新、活动推广等信息。</li>
        <li>处理您的咨询、投诉、建议等反馈。</li>
      </ul>
    </section>

    <section className="mb-6" id="data-protection">
      <h2 className="text-lg font-bold text-gray-900 mb-2">四、数据保护措施</h2>
      <h3 className="font-semibold mb-2">4.1 数据存储</h3>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>我们在中国境内存储您的个人信息。</li>
        <li>数据存储期限以实现本政策所述目的所需的最短期限为限。</li>
        <li>当达到存储期限后，您的个人信息将被删除或匿名化处理。</li>
      </ul>
      <h3 className="font-semibold mb-2">4.2 技术保护</h3>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>采用加密技术保护您的个人信息，防止信息泄露、篡改。</li>
        <li>使用访问控制技术限制对个人信息的访问权限。</li>
        <li>定期进行安全评估和漏洞扫描，及时修复安全问题。</li>
        <li>建立数据备份和灾难恢复机制，保障数据安全。</li>
      </ul>
      <h3 className="font-semibold mb-2">4.3 管理保护</h3>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>制定并执行严格的信息安全管理制度和操作规程。</li>
        <li>对接触个人信息的员工进行安全培训和授权管理。</li>
        <li>建立个人信息泄露应急处理机制。</li>
      </ul>
      <h3 className="font-semibold mb-2">4.4 信息共享</h3>
      <p className="mb-2 pl-4 font-medium">我们不会向第三方共享您的个人信息，除非：</p>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>获得您的明确同意。</li>
        <li>根据法律法规或政府机关要求。</li>
        <li>为履行合同所必需，如委托第三方提供特定服务。</li>
        <li>维护我们的合法权益，如防止欺诈、违法行为等。</li>
      </ul>
    </section>

    <section className="mb-6" id="user-rights-privacy">
      <h2 className="text-lg font-bold text-gray-900 mb-2">五、用户权利</h2>
      <h3 className="font-semibold mb-2">5.1 查阅权</h3>
      <p className="mb-3 pl-4">您有权查询我们收集、存储的您的个人信息。</p>
      <h3 className="font-semibold mb-2">5.2 更正权</h3>
      <p className="mb-3 pl-4">您有权要求更正您的个人信息中不准确或不完整的内容。</p>
      <h3 className="font-semibold mb-2">5.3 删除权</h3>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>在特定情况下，您有权要求删除您的个人信息。</li>
        <li>注销账号后，您的个人信息将被删除或匿名化处理。</li>
      </ul>
      <h3 className="font-semibold mb-2">5.4 撤回同意</h3>
      <p className="mb-3 pl-4">您有权撤回对个人信息处理的同意，但撤回不影响撤回前已进行的合法处理。</p>
      <h3 className="font-semibold mb-2">5.5 行使权利的方式</h3>
      <p className="mb-3 pl-4">
        您可以通过本产品提供的功能或联系我们（如客服邮箱、客服电话等）行使上述权利。我们将在15个工作日内予以处理并答复。
      </p>
    </section>

    <section className="mb-6" id="cookies">
      <h2 className="text-lg font-bold text-gray-900 mb-2">六、Cookie及相关技术</h2>
      <h3 className="font-semibold mb-2">6.1 Cookie的使用</h3>
      <p className="mb-3 pl-4">
        我们使用Cookie和类似技术来提升用户体验，如保存登录状态、记住您的偏好设置等。您可以通过浏览器设置管理或删除Cookie。
      </p>
      <h3 className="font-semibold mb-2">6.2 Cookie的管理</h3>
      <p className="mb-3 pl-4">
        您可以通过浏览器设置禁用Cookie，但可能影响本产品的某些功能正常使用。
      </p>
    </section>

    <section className="mb-6" id="minors">
      <h2 className="text-lg font-bold text-gray-900 mb-2">七、未成年人保护</h2>
      <p className="mb-3 pl-4">
        本产品主要面向成年用户。如您为未成年人，请在监护人指导下使用本产品。我们将根据《中华人民共和国未成年人保护法》等法律法规，加强对未成年人个人信息的保护。
      </p>
    </section>

    <section className="mb-6" id="policy-update">
      <h2 className="text-lg font-bold text-gray-900 mb-2">八、政策更新</h2>
      <p className="mb-3 pl-4">
        我们可能会适时修订本隐私政策。修订后的政策将在本产品内公告。如您继续使用本产品，即表示您同意接受修订后的政策。
      </p>
    </section>

    <section className="mb-6">
      <h2 className="text-lg font-bold text-gray-900 mb-2">九、联系我们</h2>
      <p className="mb-3 pl-4">
        如您对本隐私政策有任何疑问、意见或建议，或需要行使相关权利，请通过本产品提供的客服渠道与我们联系。
      </p>
      <p className="mt-4 text-xs text-gray-500">最后更新日期：2026年2月18日</p>
    </section>
  </div>
);

export const AgreementDialog = observer(({ open, onClose, type }: AgreementDialogProps) => {
  const title = type === 'agreement' ? '用户使用协议' : '隐私政策';
  
  return (
    <Dialog
      open={open}
      onOpenChange={onClose}
      onClose={onClose}
      onDismiss={onClose}
      title={title}
      width="30rem"
      dismissible
    >
      <AgreementContent type={type} />
    </Dialog>
  );
});
