import { InstitutionLinkDiscoveryService } from './institution-link-discovery.service';

describe('InstitutionLinkDiscoveryService', () => {
  const service = new InstitutionLinkDiscoveryService();

  it('extracts record-level context from homepage surfaces', () => {
    const snapshot = service.buildSnapshot(
      {
        id: 'SNU',
        name: '서울대학교',
        priorityServiceTypes: ['scholarship'],
      } as any,
      [
        {
          url: 'https://example.edu/notice',
          html: `
            <html>
              <body>
                <ul>
                  <li>
                    <span>2026.03.14</span>
                    <a href="/bbs/view.do?nttId=123">2026학년도 1학기 장학금 신청 안내</a>
                    <p>학생지원과 장학금 신청 기간 안내</p>
                  </li>
                </ul>
              </body>
            </html>
          `,
        },
      ],
      '2026-03-14T00:00:00.000Z',
    );

    const link = snapshot.sections[0].links[0];

    expect(link.recordType).toBe('post');
    expect(link.postedAt).toBe('2026-03-14');
    expect(link.excerpt).toContain('학생지원과');
    expect(link.title).toContain('장학금 신청 안내');
  });
});
