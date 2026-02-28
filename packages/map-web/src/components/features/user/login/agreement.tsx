import { useTranslation } from '@endfieldmap/map-service';
import { Dialog } from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

export interface AgreementDialogProps {
  open: boolean;
  onClose: () => void;
  type: 'agreement' | 'privacy';
}

export interface AgreementLinkProps {
  onClick: (type: 'agreement' | 'privacy') => void;
}

const AgreementContent = observer(({ type }: { type: 'agreement' | 'privacy' }) => {
  const { t } = useTranslation('agreement');

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
    return (
      <UserAgreementContent
        t={(key: string) =>
          t(key, {
            defaultValue: key,
          })
        }
      />
    );
  }
  return (
    <PrivacyPolicyContent
      t={(key: string) =>
        t(key, {
          defaultValue: key,
        })
      }
    />
  );
});

const UserAgreementContent = ({ t }: { t: (key: string) => string }) => (
  <div className="p-6 text-sm text-gray-800 leading-relaxed max-h-96 overflow-y-auto">
    <section className="mb-6">
      <h2 className="text-lg font-bold text-gray-900 mb-2">{t('user_agreement.chapter_1.title')}</h2>
      <h3 className="font-semibold mb-2">{t('user_agreement.chapter_1.section_1.title')}</h3>
      <p className="mb-3 pl-4">{t('user_agreement.chapter_1.section_1.content')}</p>
      <h3 className="font-semibold mb-2">{t('user_agreement.chapter_1.section_2.title')}</h3>
      <p className="mb-3 pl-4">{t('user_agreement.chapter_1.section_2.content')}</p>
    </section>

    <section className="mb-6" id="account-usage">
      <h2 className="text-lg font-bold text-gray-900 mb-2">{t('user_agreement.chapter_2.title')}</h2>
      <h3 className="font-semibold mb-2">{t('user_agreement.chapter_2.section_1.title')}</h3>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>{t('user_agreement.chapter_2.section_1.content_1')}</li>
        <li>{t('user_agreement.chapter_2.section_1.content_2')}</li>
        <li>{t('user_agreement.chapter_2.section_1.content_3')}</li>
      </ul>
      <h3 className="font-semibold mb-2">{t('user_agreement.chapter_2.section_2.title')}</h3>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>{t('user_agreement.chapter_2.section_2.content_1')}</li>
        <li>{t('user_agreement.chapter_2.section_2.content_2')}</li>
        <li>{t('user_agreement.chapter_2.section_2.content_3')}</li>
      </ul>
      <h3 className="font-semibold mb-2">{t('user_agreement.chapter_2.section_3.title')}</h3>
      <p className="mb-3 pl-4">{t('user_agreement.chapter_2.section_3.content')}</p>
    </section>

    <section className="mb-6" id="user-rights">
      <h2 className="text-lg font-bold text-gray-900 mb-2">{t('user_agreement.chapter_3.title')}</h2>
      <h3 className="font-semibold mb-2">{t('user_agreement.chapter_3.section_1.title')}</h3>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>{t('user_agreement.chapter_3.section_1.content_1')}</li>
        <li>{t('user_agreement.chapter_3.section_1.content_2')}</li>
        <li>{t('user_agreement.chapter_3.section_1.content_3')}</li>
        <li>{t('user_agreement.chapter_3.section_1.content_4')}</li>
      </ul>
      <h3 className="font-semibold mb-2">{t('user_agreement.chapter_3.section_2.title')}</h3>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>{t('user_agreement.chapter_3.section_2.content_1')}</li>
        <li>{t('user_agreement.chapter_3.section_2.content_2')}</li>
        <li>{t('user_agreement.chapter_3.section_2.content_3')}</li>
        <li>{t('user_agreement.chapter_3.section_2.content_4')}</li>
      </ul>
    </section>

    <section className="mb-6" id="liability">
      <h2 className="text-lg font-bold text-gray-900 mb-2">{t('user_agreement.chapter_4.title')}</h2>
      <h3 className="font-semibold mb-2">{t('user_agreement.chapter_4.section_1.title')}</h3>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>{t('user_agreement.chapter_4.section_1.content_1')}</li>
        <li>{t('user_agreement.chapter_4.section_1.content_2')}</li>
        <li>{t('user_agreement.chapter_4.section_1.content_3')}</li>
      </ul>
      <h3 className="font-semibold mb-2">{t('user_agreement.chapter_4.section_2.title')}</h3>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>{t('user_agreement.chapter_4.section_2.content_1')}</li>
        <li>{t('user_agreement.chapter_4.section_2.content_2')}</li>
        <li>{t('user_agreement.chapter_4.section_2.content_3')}</li>
      </ul>
    </section>

    <section className="mb-6" id="disclaimer">
      <h2 className="text-lg font-bold text-gray-900 mb-2">{t('user_agreement.chapter_5.title')}</h2>
      <h3 className="font-semibold mb-2">{t('user_agreement.chapter_5.section_1.title')}</h3>
      <p className="mb-3 pl-4">{t('user_agreement.chapter_5.section_1.content')}</p>
      <h3 className="font-semibold mb-2">{t('user_agreement.chapter_5.section_2.title')}</h3>
      <p className="mb-3 pl-4">{t('user_agreement.chapter_5.section_2.content')}</p>
      <h3 className="font-semibold mb-2">{t('user_agreement.chapter_5.section_3.title')}</h3>
      <p className="mb-3 pl-4">{t('user_agreement.chapter_5.section_3.content')}</p>
    </section>

    <section className="mb-6" id="dispute-resolution">
      <h2 className="text-lg font-bold text-gray-900 mb-2">{t('user_agreement.chapter_6.title')}</h2>
      <h3 className="font-semibold mb-2">{t('user_agreement.chapter_6.section_1.title')}</h3>
      <p className="mb-3 pl-4">{t('user_agreement.chapter_6.section_1.content')}</p>
      <h3 className="font-semibold mb-2">{t('user_agreement.chapter_6.section_2.title')}</h3>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>{t('user_agreement.chapter_6.section_2.content_1')}</li>
        <li>{t('user_agreement.chapter_6.section_2.content_2')}</li>
      </ul>
      <h3 className="font-semibold mb-2">{t('user_agreement.chapter_6.section_3.title')}</h3>
      <p className="mb-3 pl-4">{t('user_agreement.chapter_6.section_3.content')}</p>
    </section>

    <section className="mb-6">
      <h2 className="text-lg font-bold text-gray-900 mb-2">{t('user_agreement.chapter_7.title')}</h2>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>{t('user_agreement.chapter_7.content_1')}</li>
        <li>{t('user_agreement.chapter_7.content_2')}</li>
        <li>{t('user_agreement.chapter_7.content_3')}</li>
      </ul>
      <p className="mt-4 text-xs text-gray-500">{t('common.last_updated')}</p>
    </section>
  </div>
);

const PrivacyPolicyContent = ({ t }: { t: (key: string) => string }) => (
  <div className="p-6 text-sm text-gray-800 leading-relaxed max-h-96 overflow-y-auto">
    <section className="mb-6">
      <h2 className="text-lg font-bold text-gray-900 mb-2">{t('privacy_policy.chapter_1.title')}</h2>
      <p className="mb-3 pl-4">{t('privacy_policy.chapter_1.content_1')}</p>
      <p className="mb-3 pl-4">{t('privacy_policy.chapter_1.content_2')}</p>
    </section>

    <section className="mb-6" id="data-collection">
      <h2 className="text-lg font-bold text-gray-900 mb-2">{t('privacy_policy.chapter_2.title')}</h2>
      <h3 className="font-semibold mb-2">{t('privacy_policy.chapter_2.section_1.title')}</h3>
      <p className="mb-2 pl-4 font-medium">{t('privacy_policy.chapter_2.section_1.subtitle_1')}</p>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>{t('privacy_policy.chapter_2.section_1.content_1_1')}</li>
        <li>{t('privacy_policy.chapter_2.section_1.content_1_2')}</li>
      </ul>
      <p className="mb-2 pl-4 font-medium">{t('privacy_policy.chapter_2.section_1.subtitle_2')}</p>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>{t('privacy_policy.chapter_2.section_1.content_2_1')}</li>
        <li>{t('privacy_policy.chapter_2.section_1.content_2_2')}</li>
      </ul>
      <h3 className="font-semibold mb-2">{t('privacy_policy.chapter_2.section_2.title')}</h3>
      <p className="mb-2 pl-4 font-medium">{t('privacy_policy.chapter_2.section_2.subtitle_1')}</p>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>{t('privacy_policy.chapter_2.section_2.content_1_1')}</li>
        <li>{t('privacy_policy.chapter_2.section_2.content_1_2')}</li>
      </ul>
      <p className="mb-2 pl-4 font-medium">{t('privacy_policy.chapter_2.section_2.subtitle_2')}</p>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>{t('privacy_policy.chapter_2.section_2.content_2_1')}</li>
        <li>{t('privacy_policy.chapter_2.section_2.content_2_2')}</li>
      </ul>
      <h3 className="font-semibold mb-2">{t('privacy_policy.chapter_2.section_3.title')}</h3>
      <p className="mb-3 pl-4">{t('privacy_policy.chapter_2.section_3.content')}</p>
    </section>

    <section className="mb-6" id="data-usage">
      <h2 className="text-lg font-bold text-gray-900 mb-2">{t('privacy_policy.chapter_3.title')}</h2>
      <h3 className="font-semibold mb-2">{t('privacy_policy.chapter_3.section_1.title')}</h3>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>{t('privacy_policy.chapter_3.section_1.content_1')}</li>
        <li>{t('privacy_policy.chapter_3.section_1.content_2')}</li>
        <li>{t('privacy_policy.chapter_3.section_1.content_3')}</li>
      </ul>
      <h3 className="font-semibold mb-2">{t('privacy_policy.chapter_3.section_2.title')}</h3>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>{t('privacy_policy.chapter_3.section_2.content_1')}</li>
        <li>{t('privacy_policy.chapter_3.section_2.content_2')}</li>
        <li>{t('privacy_policy.chapter_3.section_2.content_3')}</li>
      </ul>
      <h3 className="font-semibold mb-2">{t('privacy_policy.chapter_3.section_3.title')}</h3>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>{t('privacy_policy.chapter_3.section_3.content_1')}</li>
        <li>{t('privacy_policy.chapter_3.section_3.content_2')}</li>
        <li>{t('privacy_policy.chapter_3.section_3.content_3')}</li>
      </ul>
      <h3 className="font-semibold mb-2">{t('privacy_policy.chapter_3.section_4.title')}</h3>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>{t('privacy_policy.chapter_3.section_4.content_1')}</li>
        <li>{t('privacy_policy.chapter_3.section_4.content_2')}</li>
      </ul>
    </section>

    <section className="mb-6" id="data-protection">
      <h2 className="text-lg font-bold text-gray-900 mb-2">{t('privacy_policy.chapter_4.title')}</h2>
      <h3 className="font-semibold mb-2">{t('privacy_policy.chapter_4.section_1.title')}</h3>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>{t('privacy_policy.chapter_4.section_1.content_1')}</li>
        <li>{t('privacy_policy.chapter_4.section_1.content_2')}</li>
        <li>{t('privacy_policy.chapter_4.section_1.content_3')}</li>
      </ul>
      <h3 className="font-semibold mb-2">{t('privacy_policy.chapter_4.section_2.title')}</h3>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>{t('privacy_policy.chapter_4.section_2.content_1')}</li>
        <li>{t('privacy_policy.chapter_4.section_2.content_2')}</li>
        <li>{t('privacy_policy.chapter_4.section_2.content_3')}</li>
        <li>{t('privacy_policy.chapter_4.section_2.content_4')}</li>
      </ul>
      <h3 className="font-semibold mb-2">{t('privacy_policy.chapter_4.section_3.title')}</h3>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>{t('privacy_policy.chapter_4.section_3.content_1')}</li>
        <li>{t('privacy_policy.chapter_4.section_3.content_2')}</li>
        <li>{t('privacy_policy.chapter_4.section_3.content_3')}</li>
      </ul>
      <h3 className="font-semibold mb-2">{t('privacy_policy.chapter_4.section_4.title')}</h3>
      <p className="mb-2 pl-4 font-medium">{t('privacy_policy.chapter_4.section_4.subtitle')}</p>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>{t('privacy_policy.chapter_4.section_4.content_1')}</li>
        <li>{t('privacy_policy.chapter_4.section_4.content_2')}</li>
        <li>{t('privacy_policy.chapter_4.section_4.content_3')}</li>
        <li>{t('privacy_policy.chapter_4.section_4.content_4')}</li>
      </ul>
    </section>

    <section className="mb-6" id="user-rights-privacy">
      <h2 className="text-lg font-bold text-gray-900 mb-2">{t('privacy_policy.chapter_5.title')}</h2>
      <h3 className="font-semibold mb-2">{t('privacy_policy.chapter_5.section_1.title')}</h3>
      <p className="mb-3 pl-4">{t('privacy_policy.chapter_5.section_1.content')}</p>
      <h3 className="font-semibold mb-2">{t('privacy_policy.chapter_5.section_2.title')}</h3>
      <p className="mb-3 pl-4">{t('privacy_policy.chapter_5.section_2.content')}</p>
      <h3 className="font-semibold mb-2">{t('privacy_policy.chapter_5.section_3.title')}</h3>
      <ul className="mb-3 pl-6 list-disc space-y-1">
        <li>{t('privacy_policy.chapter_5.section_3.content_1')}</li>
        <li>{t('privacy_policy.chapter_5.section_3.content_2')}</li>
      </ul>
      <h3 className="font-semibold mb-2">{t('privacy_policy.chapter_5.section_4.title')}</h3>
      <p className="mb-3 pl-4">{t('privacy_policy.chapter_5.section_4.content')}</p>
      <h3 className="font-semibold mb-2">{t('privacy_policy.chapter_5.section_5.title')}</h3>
      <p className="mb-3 pl-4">{t('privacy_policy.chapter_5.section_5.content')}</p>
    </section>

    <section className="mb-6" id="cookies">
      <h2 className="text-lg font-bold text-gray-900 mb-2">{t('privacy_policy.chapter_6.title')}</h2>
      <h3 className="font-semibold mb-2">{t('privacy_policy.chapter_6.section_1.title')}</h3>
      <p className="mb-3 pl-4">{t('privacy_policy.chapter_6.section_1.content')}</p>
      <h3 className="font-semibold mb-2">{t('privacy_policy.chapter_6.section_2.title')}</h3>
      <p className="mb-3 pl-4">{t('privacy_policy.chapter_6.section_2.content')}</p>
    </section>

    <section className="mb-6" id="minors">
      <h2 className="text-lg font-bold text-gray-900 mb-2">{t('privacy_policy.chapter_7.title')}</h2>
      <p className="mb-3 pl-4">{t('privacy_policy.chapter_7.content')}</p>
    </section>

    <section className="mb-6" id="policy-update">
      <h2 className="text-lg font-bold text-gray-900 mb-2">{t('privacy_policy.chapter_8.title')}</h2>
      <p className="mb-3 pl-4">{t('privacy_policy.chapter_8.content')}</p>
    </section>

    <section className="mb-6">
      <h2 className="text-lg font-bold text-gray-900 mb-2">{t('privacy_policy.chapter_9.title')}</h2>
      <p className="mb-3 pl-4">{t('privacy_policy.chapter_9.content')}</p>
      <p className="mt-4 text-xs text-gray-500">{t('common.last_updated')}</p>
    </section>
  </div>
);

export const AgreementLink = ({ onClick }: AgreementLinkProps) => {
  const { t } = useTranslation('agreement');

  return (
    <>
      <span>{t('common.read_and_agree')}</span>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onClick('agreement');
        }}
        className="text-[#ffff21] hover:text-[#ffd700] underline underline-offset-2"
      >
        {t('user_agreement.title')}
      </button>
      <span>{t('common.and')}</span>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onClick('privacy');
        }}
        className="text-[#ffff21] hover:text-[#ffd700] underline underline-offset-2"
      >
        {t('privacy_policy.title')}
      </button>
    </>
  );
};

export const AgreementDialog = observer(({ open, onClose, type }: AgreementDialogProps) => {
  const { t } = useTranslation('agreement');
  const title = type === 'agreement' ? t('user_agreement.title') : t('privacy_policy.title');

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
