class ParticleSystem {
    constructor() {
        this.canvas = document.getElementById('particleCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.isGathered = false;
        this.animationId = null;
        this.mouseX = 0;
        this.mouseY = 0;


        // Supabase 클라이언트 초기화
        this.supabase = null;
        this.initSupabase();
        
        this.init();
        this.setupEventListeners();
        this.loadParticlesFromStorage();
        this.animate();
        this.updateDreamCounter();
    }
async loadParticlesFromSupabase() {
        const { data, error } = await this.supabase
            .from('particles')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('❌ Supabase fetch 실패:', error);
            return;
        }

        const loadedParticles = data.map((p) => this.createParticle({
            title: p.title,
            description: p.description,
            color: p.color,
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
        }));

        this.particles = loadedParticles;
        this.updateDreamCounter();
        this.saveParticlesToStorage();
        console.log(`✅ Supabase에서 ${data.length}개 파티클 불러옴`);
    }
    

    updateDreamCounter() {
    const counter = document.getElementById('dreamCounter');
    if (counter) {
        counter.textContent = `모인 꿈 수: ${this.particles.length}`;
    }
}


        initSupabase() {
        // 브라우저 환경에서 window 객체를 통해 설정값 가져오기
        const supabaseUrl = window.SUPABASE_URL || 'your-supabase-url';
        const supabaseKey = window.SUPABASE_ANON_KEY || 'your-supabase-anon-key';
        
        if (supabaseUrl && supabaseKey && 
            supabaseUrl !== 'your-supabase-url' && 
            supabaseKey !== 'your-supabase-anon-key') {
            try {
                // Supabase 클라이언트 생성
                if (typeof window !== 'undefined' && window.supabase) {
                    this.supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
                    console.log('Supabase 연결 성공!');
                } else {
                    console.warn('Supabase 라이브러리가 로드되지 않았습니다.');
                }
            } catch (error) {
                console.warn('Supabase 초기화 실패, localStorage 사용:', error);
            }
        } else {
            console.warn('Supabase 설정이 없습니다. localStorage를 사용합니다.');
        }
    }
    
    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    setupEventListeners() {
        // 마우스 이동 이벤트 추가
        this.canvas.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
        });
        
        // 마우스 휠 이벤트
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.handleWheel(e);
        });
        
        // 캔버스 클릭 이벤트
        this.canvas.addEventListener('click', (e) => {
            this.handleCanvasClick(e);
        });
        
        // 모달 관련 이벤트
        this.setupModalEvents();
    }
    
    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = event.clientX - rect.left;
        this.mouseY = event.clientY - rect.top;
    }
    
    setupModalEvents() {
        const addBtn = document.getElementById('addParticleBtn');
        const infoBtn = document.getElementById('infoBtn');
        const addModal = document.getElementById('addModal');
        const particleModal = document.getElementById('particleModal');
        const infoModal = document.getElementById('infoModal');
        
        // 파티클 추가 모달
        addBtn.addEventListener('click', () => {
            addModal.style.display = 'block';
        });
        
        document.getElementById('addModalClose').addEventListener('click', () => {
            // 폼 초기화 추가
        document.getElementById('particleTitle').value = '';
        document.getElementById('particleAuthor').value = '';
        document.getElementById('particleDescription').value = '';
        document.getElementById('particleColor').value = '#605E58';
    
        addModal.style.display = 'none';
        });
        
        document.getElementById('cancelAdd').addEventListener('click', () => {
            addModal.style.display = 'none';
        });
        
        document.getElementById('confirmAdd').addEventListener('click', () => {
            this.addNewParticle();
        });
        
        // 작품 설명 모달
        infoBtn.addEventListener('click', () => {
            infoModal.style.display = 'block';
        });
        
        document.getElementById('infoModalClose').addEventListener('click', () => {
            infoModal.style.display = 'none';
        });
        
        // 파티클 정보 모달
        document.getElementById('particleModalClose').addEventListener('click', () => {
            particleModal.style.display = 'none';
        });
        
        // 모달 외부 클릭 이벤트 제거 - 배경 클릭으로 닫히지 않도록 함
        // 기존 코드:
        // window.addEventListener('click', (e) => {
        //     if (e.target.classList.contains('modal')) {
        //         e.target.style.display = 'none';
        //     }
        // });
        
        // ESC 키로 모달 닫기 (선택사항)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
              // 파티클 추가 모달이 열려있을 때만 초기화
                  if (addModal.style.display === 'block') {
                      document.getElementById('particleTitle').value = '';
                      document.getElementById('particleAuthor').value = '';
                      document.getElementById('particleDescription').value = '';
                      document.getElementById('particleColor').value = '#605E58';
        }
                // 열려있는 모든 모달 닫기
                addModal.style.display = 'none';
                particleModal.style.display = 'none';
                infoModal.style.display = 'none';
            }
        });
    }
    
    createParticle(data) {
        const x = data.x !== undefined ? data.x : Math.random() * this.canvas.width;
        const y = data.y !== undefined ? data.y : Math.random() * this.canvas.height;
        
        return {
            id: data.id || this.generateId(),
            x: x,
            y: y,
            originalX: x,
            originalY: y,
            targetX: data.targetX !== undefined ? data.targetX : x,
            targetY: data.targetY !== undefined ? data.targetY : y,
            vx: Math.random() * 1 + 0.5, // 0.5~1.5 속도로 오른쪽으로 이동
            vy: (Math.random() - 0.5) * 0.2, // 상하 움직임 최소화
            color: data.color || this.getRandomColor(),
            title: data.title || `파티클 ${this.particles.length + 1}`,
            author: data.author || '익명',
            description: data.description || '기본 파티클입니다.',
            radius: 8,
            isGathered: data.isGathered !== undefined ? data.isGathered : false,
            isHovered: false // 마우스 호버 상태 추가
        };
    }
    
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
    
    getRandomColor() {
        const pastelColors = [
            '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
            '#FFB3E6', '#C9BAFF', '#FFCCCB', '#B3E5D1', '#E6E6FA',
            '#F0E68C', '#DDA0DD', '#98FB98', '#F5DEB3', '#FFE4E1',
            '#E0FFFF', '#FFEFD5', '#D8BFD8', '#AFEEEE', '#F5F5DC'
        ];
        return pastelColors[Math.floor(Math.random() * pastelColors.length)];
    }
    

     // 데이터베이스에서 파티클 로드
    async loadParticlesFromDatabase() {
        if (this.supabase) {
            try {
                console.log('데이터베이스에서 파티클 로드 중...');
                const { data, error } = await this.supabase
                    .from('particles')
                    .select('*')
                    .order('created_at', { ascending: true });
                
                if (error) {
                    console.error('데이터베이스 로드 오류:', error);
                    this.loadParticlesFromStorage(); // 실패 시 localStorage 사용
                    return;
                }
                
                if (data && data.length > 0) {
                    console.log(`데이터베이스에서 ${data.length}개 파티클 로드됨`);
                    this.particles = data.map(item => this.createParticle({
                        id: item.id,
                        title: item.title,
                        description: item.description,
                        color: item.color,
                        isGathered: false // 초기 로드 시에는 모두 흩어진 상태
                    }));
                    this.distributeParticles();
                } else {
                    console.log('데이터베이스가 비어있음, 기본 파티클 생성');
                    this.generateDefaultParticles();
                }
            } catch (error) {
                console.error('데이터베이스 연결 오류:', error);
                this.loadParticlesFromStorage(); // 실패 시 localStorage 사용
            }
        } else {
            console.log('Supabase 연결 없음, localStorage 사용');
            // Supabase가 없으면 localStorage 사용
            this.loadParticlesFromStorage();
        }
        this.updateDreamCounter();
    }
    
    
    // localStorage에서 파티클 로드 (백업용)
    loadParticlesFromStorage() {
        const savedParticles = localStorage.getItem('particles');
        if (savedParticles) {
            try {
                const particleData = JSON.parse(savedParticles);
                // 저장된 파티클을 불러오되, 위치는 새로 설정
                this.particles = particleData.map(data => {
                    const particle = this.createParticle({
                        id: data.id,
                        title: data.title,
                        author: data.author,
                        description: data.description,
                        color: data.color
                    });
                    return particle;
                });
                
                // 파티클들을 화면 전체에 고르게 분포
                this.distributeParticles();
            } catch (e) {
                console.error("파티클 데이터 로드 오류:", e);
                this.generateDefaultParticles();
            }
        } else {
            this.generateDefaultParticles();
            this.updateDreamCounter();

        }
    }
    
    // 파티클들을 화면 전체에 고르게 분포
    distributeParticles() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        this.particles.forEach((particle, index) => {
            // 화면 전체에 랜덤하게 분포
            particle.x = Math.random() * width;
            particle.y = Math.random() * height;
            particle.originalX = particle.x;
            particle.originalY = particle.y;
            particle.targetX = particle.x;
            particle.targetY = particle.y;
        });
    }

     // 데이터베이스에 파티클 저장
    async saveParticleToDatabase(particleData) {
        if (this.supabase) {
            try {
                console.log('데이터베이스에 파티클 저장 중...');
                const { data, error } = await this.supabase
                    .from('particles')
                    .insert([{
                        title: particleData.title,
                        author_name: particleData.author,
                        description: particleData.description,
                        color: particleData.color
                    }])
                    .select();
                
                if (error) {
                    console.error('데이터베이스 저장 오류:', error);
                    // 실패 시 localStorage에 저장
                    this.saveParticlesToStorage();
                    return null;
                }
                
                console.log('데이터베이스 저장 성공:', data[0]);
                return data[0];
            } catch (error) {
                console.error('데이터베이스 연결 오류:', error);
                // 실패 시 localStorage에 저장
                this.saveParticlesToStorage();
                return null;
            }
        } else {
            console.log('Supabase 연결 없음, localStorage에 저장');
            // Supabase가 없으면 localStorage에 저장
            this.saveParticlesToStorage();
            return null;
        }
    }   
    
    // localStorage에 파티클 저장 (백업용)
    saveParticlesToStorage() {
        const particleData = this.particles.map(p => ({
            id: p.id,
            title: p.title,
            author: p.author,
            description: p.description,
            color: p.color
            // 위치 정보는 저장하지 않음 (매번 새로 배치)
        }));
        localStorage.setItem('particles', JSON.stringify(particleData));
        console.log('localStorage에 저장됨');
    }
    
    generateDefaultParticles() {
        const defaultParticles = [
            { title: '꿈눈', author: '현', description: '눈이 오는 날 학교에 눈덩이 있었다.. 눈사람이 아닌 줄 알고 발로 차려버렸다. 알고 보니 그건 눈사람이었다.. 주인이 만들다 중간에 잠깐 수업을 간거였다…. 그래서 결국 난 다시 새롭게 눈덩이를 만들어 드렸다.. ', color: '#FFB3BA' },
            { title: '신전떡볶이', author: '재윤친구', description: '신전떡볶이 먹는 꿈', color: '#BAFFC9' },
            { title: '배틀그라운드', author: '익명', description: '꿈에서 현실로 총들고 배그함', color: '#BAE1FF' },
            { title: '체육관', author: '나상현', description: '체육관에서 운동하고 있는데 체육관 구석에서 코브라 뱀들이 한 100마리..? 나와서 공격했어요', color: '#FFFFBA' },
            { title: '노스텔지어', author: '쥐', description: '더는 만나지 않는 친구와 횡단보도를 건너며 아주 아주 크게 웃는 꿈을 꾸었다.', color: '#D8CFC9' },
            { title: '수업종료', author: '나상현', description: '학교 체육 선생님이 구르기 시범을 보여주시다 그만 목뼈가 부러지셔서 돌아가셨어요.  ', color: '#F2E8E0' },
            { title: '기웃거리다가 다른 세계', author: '최예진', description: '옛날에 살던 동네 골목을 걷고 있었음. 자주 가던 빌딩 앞에 흑인 몇 명이 앉아있길래 뭔가 싶어서 기웃거렸더니 들어오라고 했음. 그래서 들어갔더니, 안에 외국인이랑 한국인이랑 키 작은 난쟁이들이 섞여 있는 클럽 같은 데가 나왔음. 거기서 좀 놀고 있었는데, 꼭대기 층으로 올라가보라고 해서 올라감.  꼭대기 층은 사장실처럼 생긴 방이었고, 안에는 장난감이 잔뜩 있었음. 그 방에는 난쟁이 사장이 있었고, 나한테 슈퍼마리오 굴뚝처럼 생긴 통로로 들어가보라고 했음. 그래서 들어갔더니 갑자기 내가 알던 평범한 지하철역으로 나와버렸음.', color: '#9A8E88' },
            { title: '터전', author: '베햄베', description: '시리즈로 꾸는 꿈이 있다. 2000년대 주택 같은 곳이 배경. 노란 장판에 하얀 한지같은 벽지가 발라져있는 집이다. 나는 무언가에 쫓겨 한 방으로 들어간다. 분명 처음 가보는 곳인데 나는 이곳의 비밀을 알고있다. 세로로 길다란 짙은 갈색의 나무 옷장을 연다. 두개의 단으로 나뉘어져있는데 윗부분은 좁다. 나는 그곳이 옆방으로 향하는 문이라는 걸 안다. 겨우 겨우 기어서 넘어가면 옆방이 나온다. 그렇게 잠에서 깼다. 이어졌던 꿈에서는 어김없이 그 옷장으로 도망을 갔는데 연결된 방이 아주 큰 한옥이였다. 여러개의 방이 있었고 나는 옛날부터 이곳에 살았었다. 여기저기 쏘다니며 집을 구경한다. 그러다 또 꿈에서 깬다.', color: '#B8ADA8' },
            { title: '공중부양', author: '박스', description: '초등학교생 때 운동장에서 달리지않고 공중에 뜬 상태로 운동장을 질주하던 꿈', color: '#C1BAB1' },
            { title: '바다', author: '이태경', description: '금색 밀밭에 있는 오두막에서 나오는 나', color: '#FFDFBA' },
            { title: '얼떨떨', author: '현', description: '여행을 가야 하는데 화장하느라 비행기 시간을 놓쳐서 못 갔어요ㅜ 같이 가기로 한 친구한테 엄청 혼날 줄 알았는데 그냥 웃고 넘어가서 얼떨떨해 하다가 꿈에서 깼습니다..', color: '#FF4E00' },
            { title: '세상에서 가장 우아한 초능력', author: '배점이', description: '팔을 양 옆으로 벌려 새처럼 나는 손짓을 하면 날 수 있었다. 체공 높이가 그리 높진 않았지만 노력하면 5층 높이의 건물 정도는 뛰어넘을 수 있었다. 기분이 너무 좋았다. 날 수 있다는 사실 자체로도 좋았지만, 지구상에서 나만 가진 능력이라는 점에서 오는 우월감 역시 이에 크게 작용했다. 기억 나는 건 이게 다다.', color: '#B7B0AA' },
            { title: '과거의 케이크', author: '최혜린', description: '꿈 일기  예전에 살던 자취방에서 뭔가 정리하는 꿈을 꿨다. 그리고 거기엔 ㅇㅇ언니가 있었고.. 마지막에는 빌라 1층에서 케이크를 먹었다. ', color: '#FFC107' },
            { title: '그리움', author: '청본(靑本)', description: '눈을 뜨자, 돌아가신 사촌 누나가 보였다. 그녀가 귀신임을 나는 직감적으로 알 수 있었다. 차갑고 무표정한 얼굴. 몹시 추워 보였다. 나는 겁에 질린 채 손에 들린 우산으로 그녀를 툭툭 쳤다. / 그 순간 어디선가 중절모를 쓴 낯선 할아버지가 다가와 내 어깨를 툭 치고 지나갔다. 허공에는 과일 몇 개와 두툼한 돈다발이 흩어졌다. 그제야 나는 내가 어디에 있는지를 둘러보았다. / 갈색 나무로 된 계단 위 옥탑방으로 향하는 길목이었다. 나는 천천히 계단을 내려갔다. 그때 난간 너머로 펼쳐진 광활함 속 수많은 영혼들을 마주하고야 말았다. 그러다 한 귀신이 내 눈앞으로 얼굴을 들이밀었다. 나는 비명을 지를 틈도 없이 현실로 돌아왔다. / 얼마 후 우리 가족은 한겨울의 폭설을 뚫고 친가 쪽 산소에 성묘를 다녀왔다. 초라한 누나와 그 곁의 할아버지 묘엔 육중한 눈덩이와 무거운 나무더미가 겹겹이 쌓여 있었다. / 그래서였을까. 누나와 할아버지가 내 꿈에 찾아온 이유는 무엇이었을까. 늘 성묘길에 함께했던 영가들이 내게 찾아온 건 단지 이 때문이었을까. 지난 겨울. / 땀으로 범벅되어 흩어진 혼몽을 되새기며.', color: '#E6DFDA' },
            { title: '특수요원', author: '임동하', description: '오늘 꾼 꿈인데요 제가 동기 한명과 특수요원으로 첩보작전 중에 들켜서 독맞는 꿈을 꿨어요 그러다 깼습니다', color: '#6200EA' },
            { title: '포켓몬', author: '임동하', description: '제가 포켓몬세상에서 포켓몬 코디네이터가 되는 꿈을 꿨습니다', color: '#0099A8' },
            { title: '반복', author: '이솔민', description: '악몽을 꾸게 되면, 저는 항상 같은 꿈을 꿉니다. 이래도 되나 싶을 정도의 무채색 세상에서 한눈에 다 담을 수 없는 커다란 구의 형체에 끊임없이 쫒기고 깔리기를 반복합니다. 그러다가 공중에 허우적거리다가 시커먼 구들에게 괴롭힘을 당합니다. 이처럼 제 악몽은 무채색의 세상에서 다양한 시커먼 구들에게 여러가지 방법으로 괴롭힘을 끊임없이 당하다가 깨어나게 됩니다. ', color: '#AFA29E' },
            { title: '소년배달부키키', author: '임동하', description: '제가 광덕공원에서 빗자루 타고 날아가는꿈을 꿨는데요 나무위에 멈추려고 했는데 안멈춰서 달까지 갔습니다', color: '#F72585' },
            { title: '피크닉', author: '임동하', description: '피크닉하는데 누워있다가 분홍색 손이 달린 사마귀랑 자벌레 합친거같이 생긴 벌래가 세마리있어서 파닥파닥 거리면서 기어가길래서 무서워서 깼습니다', color: '#FFB400' },
            { title: '악어 아저씨 그렇게 배가 고프시다면 저를 드세요', author: '김주성', description: '내가 사랑하는 사촌동생이 악어 아저씨에게 먹혀 신체의 반이 사라진 것을 목격한 꿈', color: '#1FAB89' },
            { title: '오잉', author: '임동하', description: '제가 공연하다가 스테이지 다이브를 해서 관객들이 행가래로 날려줬습니다 근데 천장뚫고 하늘로 날아가서 용이랑 싸우는 이상한 꿈입니다', color: '#0081CF' },
            { title: '그침의 지속', author: '윤주', description: '어떤 숲속 같은 집에 가족인것 같은 사람들이 들어가 서로 인사를 나누고 있었다. 근데 거기서 어떤 여자 아이를 기점으로 그림으로 변하는구나 생각이 들었는데 그때 실재했던것들이 수채화로 된 그림처럼 변해갔다. 그래서 인사를 나눈이유가 곧 그림으로 변하면 멈추게 되니까 미리 서로에게 인사를 나눴구나 싶었다. 초록색 숲에서부터 파란색으로 그림이 마무리 됐다', color: '#F5EEE6' },
            { title: '어린 왕자와 뱀', author: '주소리', description: '하늘에서 땅으로 떨어지고 있었다. 천천히 바람과 유영하며 착지하자 앞에 놓인 문. 문으로 들어가 보니 책상 앞에 앉아 있는 여성. 그가 앉으라 하여 맞은편 의자에 어색하게 몸을 구겨 앉았다.  "너는 글이 쓰고 싶어?"  나는 대담한 질문에 황당했지만, 여자에게 내 의지를 증명하고 싶었다. 이러저러해서 하고 싶다고 기나긴 말을 늘어놓았다. 여자는 다시 질문했다.  "다른 분야를 포기하는 것은 후회되지 않아?"  나는 말문이 막혔다. 하지만 난 글을 하고 쓰고 싶다고 답했다. 여자의 입꼬리가 휘어 올라갔다. 방의 전등이 따뜻하게 내려앉았고 여성은 이상적인 언니처럼 다정했다. 나는 이곳에 계속 머물고 싶었다. 전등이 깜빡이고 어둠이 방을 침범했다. 여자는 영어로 이야기하기 시작했다. 그의 말을 잘 듣기 위해 난 몸을 앞으로 기울였다. 여성은 동화 이야기를 하는 것 같았다.  "나는 마치 도마뱀 같았어. 알겠니, 정말 아름다운 도마뱀이었지. 시간이 지나고 나는 언덕으로 향했어. 네가 있는 것을 알고 있었거든. 시간이 됐어. 이제 가야 할 때야."  그림자가 방을 엄습하고 있었다. 여자는 내 어깨를 잡고 나에게 몸을 기울였다. 그의 갈라진 입술에서 기다란 혀를 봤다. 여자의 얼굴이 다가오고 그의 동공이 세로로 가늘게 좁혀졌다. "안 돼요. 적어도 조금만 더." 내 말은 전부 끝맺지 못 했다. 여자는 시간이 됐고 이제 떠나야 한다고 반복해서 말했다. 여자를 밀어낼 새도 없이 그가 내 목덜미를 물었다. 빛이 서서히 잦아들고 이내 어둠이 깔렸다. 나는 잠에서 깼다. 난 어린 왕자였다.', color: '#96e3ce' },
            { title: '두껍아 두껍아 이 여름 줄게, 새 여름 다오', author: '가올', description: '가족들과 여름 캠프를 갔다가, 어느 사악한 인물(만화 캐릭터처럼 생겼음, 투디였음)이 독두꺼비를 풀어서 캠핑장에 사람들이 모두 쓰러지고 나만 남는 꿈. 자기 전까지 정말 즐겁게 놀았던 하루였던지라 특히 충격적이었고, 굉장히 공포스러운데도 주변 풍경은 학습만화 그림체였어서 기억에 남는다.', color: '#D9D2CC' },
            { title: '거미줄', author: '고병용', description: '어릴 때 반복적으로 꾸던 꿈입니다. 스티로폼 냄새가 나는 것으로 시작해서 제 얼굴이 클로즈업된 상태로 얼굴만 보이다가 점점 페이드아웃되면서 엄청 큰 거미줄에 잡혀서 움직이지도 못하는 자신이 그려지고 그 스티로폼 냄새가 지속적으로 나다가 깨어납니다. 스티로폼 냄새가 무엇인지 모르겠지만 어릴적엔 이유 모르게 스티로폼 냄새라고 확신했습니다. 그래서 꿈을 꾸는데 그 냄새가 나면 [아, 그 꿈이구나] 하고 인지할 수 있었습니다.', color: '#EAE5E1' },
            { title: '볼을 깨물 때 생각나는 꿈', author: '인영', description: '나랑 같이 꿈에서 함께 도망다니던 너무 예쁜 친구가 알고보니 나를 꿈에서의 흑막이었다. 어떤 말로 걔를 상처줬는지 갑자기 돌변해서 세상을 일그러뜨리고 걔가 엄청 커져서 엄마랑 나를 죽여버렸다.', color: '#C70039' },
            { title: '몸이 기억한 거라면 너무 끔찍해 😩', author: '사카타', description: '알바하고 집 와서 너무 힘들어서 일단 누웠는데.. 스르륵 잠들었읍니다 근데 찝찝함을 이기질 못했는지 루틴을 몸이 기억한건지 샤워하고 밥 먹을 준비하는 내가 나왔읍니다 꿈에선 내가 샤워도 다 하고 뽀송해져 있었는데 정신 차리니까 커피 냄새 풀풀 나는 탈진한 여자가 침대에 누워있었습니다... 진짜 몇 분 동안 정신 못 차림', color: '#B4B0AC' },
            { title: '아포칼립스', author: '두부', description: '아주 커다란 창고형 마트에서 혼자 카트를 미는 꿈을 꿨어요. 카트 안에 담긴 건 아무것도 없었고, 사람도 아무도 없었어요.', color: '#33BBC5' },
            { title: '시체 김장 사건', author: '재윤', description: '지하철역에서 내려서 무슨 초록색반투명 통로(육교같은 거)를 지나갔더니 엘베처럼 생긴 계단이 있었음 근데 그 계단을 타고 땅?으로 내려갔는데 사람들이 인당 하나씩 깍두기같은 걸 담그고 있었음 그래서 엥 길가에서 갑자기 웬 김장?하고 가까이 가서 구경했더니 시체조각?토막?같은 거였고 피 때문에 김치처럼 보였던 거였음 그거 볼 때까지 꿈인 거 인식 못 하고 그냥 신기하다 정도로만 생각했었는데 잠 깨고서 생각해보니까 너무 소름이었음 한 5년전?에 꿨던 것 같은데 생생해서 아직 기억 함', color: '#FFDFBA' },
            { title: '종기링 종종 톡톡', author: '다니콩콩', description: '잠에서 일어났는데 옷으로 덮여있지 않은 모든 피부에 종기 같은 게 나있었음 ㄷ ㄷ 얼굴에는 좀 톡하면 터질 듯한 여드름으로 가득찼고 몸 피부에는 부분부분 금귤크기의 종기들과 그보다 작은 종기들이 가득했음. 그래서 내가 움직이면 이것들이 다 터질 거 같다고 생각함. 뭐 이런 꿈을 꿈', color: '#D0CBC7' },
            { title: '이거 타고 가면 빨리 갈 수 있어~!', author: '재윤', description: '아침 수업 가는데 우체국에 개큰택배상자를 판다는 거임 그래서 ㅇㅇㅇ랑 만나서 그거 사서 수업 가기로 햇는데 내가 옷입고 짐 챙기느라 개늦어서 히지 먼저 보내고 난 따로 우체국 감 근데 내가 가니까 종이박스는 개쬐그만 거밖에 안 팔고 큰 상자는 다 냉동식품?같은 거 넣어보내는 스티로폼 상자인 거야 그래서 혼자 불만 가득해져서 막 이걸로 어케 택배를 보내냐고 궁시렁대고 있었는데 갑자기 우체국 직원 분이 거기서 그러고 있지말고 들어와서 얘기하자길래 개쫄아서 들어갔는데 중간과정은 잘 생각이 안 나지만 내가 둥굴레차인지 커피인지를 타서 혼자 앉아가지고 먹고 있었음 ​ 생각해보니 수업 개늦었는데 내가 여기서 여유롭게 커피나 쳐마시고 있을 때가 아니다 생각하고 다급하게 챙겨입고 밖에 나왔는데 ㅇㅇ랑 ㅇ선배님이랑 날 기다리고 있던 거임 근데 ㅇㄴㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋ  나랑 마주치자마자 선배님이 개~극대노 하시면서 같이 가기로 했으면 빨리빨리 나와야되는 거 아니냐면서 겁나 머라하시는 거야 그래서 나는 속으로 선배님이랑 같이 가는 것도 아니었고 내가 ㅇㅇㅇ 보고 먼저 가라고도 했는데 왜 겁나 난리시지...라는 생각을 함 ​  그렇게 길바닥에서 혼나고 있는데 갑자기 우체국 아저씨였나 교수님이었나 그 짐 나르는 초록색 수레..? 같은 걸 타고 오시면서 이거 타고 가면 빨리 갈 수 있어~! 머 이래가지고 엇.. 탈까? 했는데 ​ 알람 울려서 잠 깸', color: '#D5C7BE' },
            { title: '7년 사귄 남자친구와 14년 지기 친구가 바람을 폈다?', author: '다니콩콩', description: '내 친구 폰에서 친구가 내 남친한테 카톡한 걸 발견함. 연락을 개많이 함. 심지어 둘이 새벽에 전화를 했는데 5시까지 함./ 그리고 전에 내 남친이 나한테 동생이랑 놀이터에 있다고 했는데 알고보니 내 친구를 만나러 같던 것!. 그리고 내 친구가 내 남친 꼬실라고 카톡하는 꼬라지도 웃기고, 둘이 손도 잡았댄다 참나. 그리고 둘이 서로 사귄다고 정의는 안 내리는 거 같았는데 어쩌면 그냥 나한테 둘이 사귀는 사실을 잘 숨겼던 걸지도? 암튼 그래서 친구폰을 다시 확인했는데 내 친구만 내 남친한테 카톡넣고, 남친은 답장이 없는 줄 알았음. 알고보니 내 친구가 남친이 답장한 것만 쏙 지워둔 것ㅎ 내 친구가 어디 놀러간다고 사진 찍어보냈는데 내 남친은 거따대고 예쁘다 ㅇㅈㄹ하고 새벽까지 전화하고 나서는 좋다고 하고 난리남. 그리고 내 남친 나랑 데이트 한 건 블로그 안 쓰면서 내 친구랑 논 거는 블로그 ㅅ씀. 그래서 이거 추궁했더니 "그냥"썻다고 하길래 개빡쳤음. 아 뒤에 내용 더 있는데 여기까지 하께요.', color: '#F6F4F1' },
            { title: '믿거 트럭', author: '재윤', description: '9시반에 지구환경과학교수님이 수업 언제 올 거냐고 어디쯤이냐고 디코보냄 그래서 내가 좀이따 나간다니까 알겠대 근데 내가 다시 잠드는 바람에 10시 10분에 깼는데 교수한테 좀만 늦어도 봐달라햇더니 교수가 물음표를 띡 보냄 난 걍 디코 무시하고 여유롭게 준비하고 택시를 타러 나갓는데 분명 난 긱사에서 나왔는데 밖은 천안역 배경이었음 그래서 와~ 큰일났당 하면서 버스 에바같아서 택시 타는데 택시가 그냥 흰 트럭이었음 근데 지금은 그걸 상관할 때가 아니니까 걍 탐 꿈 속의 나는 트럭이 교통사고 1위라는 걸 어디서 주워들었는지 내가 타고 있는 차가 트럭이라는 걸 직시하자마자 안전벨트를 겁나 꽉매고 사고 안 나게 해달라고 기도를 함 ㅋ ;; 그랬는데 기사님이 갑자기 노을 예쁘다면서 운전대에서 손을 놓고 하늘 사진을 막 찍으셨음 그 순간에 ‘아 역시 믿거 트럭이구나’ 이딴 생각울 햇음 ㅋㅋㅋㅋㅋ큐ㅠㅠㅠ 나 평소에 트럭에 편견있나? 암튼 ​ 어이없는 건 나도 같이 사진 찍어드림 ​ 그때 딱 시점 변환 됐는데 난 공보대 화장실이었고 지구환경과학 강의실 상황을 볼 수 있는 능력이 생김 잊고있던 디코에 드갔더니 교수님이 음성채널에 들어와잇길래 나도 들어가서 소리 들으면서 강의실로 가고 있었는데 들리는 바로는 지금 실험을 하고 있고 오늘 되게 중요한 거 알려줄 건데 안 오는 사람은 모를거니까 꼭 와야된다 이런 내용이었음 그러고 ㅇㅇ랑 어떤 모르는 사람이 강의실에 도착 했는지 출첵 하는 소리가 들렷고 시간을 봤을 때 10시 21분이었음 난 호다닥 실험복 입고 걍 대충 모자 쓰고 강의실로 가는 중에 !!!!! 잠깨버림 ​ 더 웃긴 건 난 분명 공보대 화장실 안이었는데 실험복이랑 모자 챙겨입는 곳은 우리집 배경이었음 끗', color: '#A69F98' },
            { title: '큐티', author: '재윤', description: '해리포터 도서관 같은 데서 막 벼락치기 하는데 과목은 영어엿음 고등학교 영어 내신 시험이었는데 공부가 하나도 안 되어있어서 급하게 문법만 흡수시킴 중학교 친구들이 나왓는데 걔네가 족집게처럼 막 알려줬어  시험 시작하는데 오엠알종이가 되게 모의고사 수능 종이길래 ??? 했더니 알고보니 수능이라는 거임 ㅆㅂ 근데 내가 오엠알에 글씨도 제대로 못 쓰는 상태여서 고등학교 이름 막 칸에 다 삐져나가게 적고 완전히 엉망으로 해서 제출함  그러고 갑자기 장면전환이 뭐 어디 숲 같은 곳으로 됐는데 거기서 강바오가 나한테 여기 바닥에 누워보라면서 두더지인지 수달인지 품에 안겨주는거임 그래서 둗인지숟인지가 내 팔에 머리 막 문지르고..촉감도 다 느껴짐 개귀여웠음 말도 할 수 있는 애였는데 뭐라했는진 까먹음', color: '#D3D3D3' },
            { title: '전쟁', author: '재윤', description: '북한이 미사일 쏜다해서 다 차타고 가족들 만나러 감 내가 운전하진 않았는데 암튼 광장 쪽으로 가니까 큰이모랑 고모랑 친척들이 다 있었음 간단하게 인사하고 계속 달리는데 진해풍경이 나와서 되게 신기했음 그 장천에서 풍호동 가는 큰 길..그 길 따라서 걍 계속 달림 그러다가 산으로 올라갔는데 학원 가는 애 발견하고 걔를 갑자기 태움 근데 산정상까지 가고 정신 차려보니까 애는 없고 운전하는 사람이 아빠가 되어있었는데 그 와중에 또 길 앞에 할머니 할아버지가 있었음 그래서 차에 태우고 갈려는데 갑자기 아빠가 차에 탈 수 있는 나이가 아닌 사람이 계속 탈려고 한다고 내리라는 거임 보니까 전쟁대피상황에서 젊은 사람 우선시 하는 느낌이었음 그래서 할머니할아버지 산에다가 두고 가야하는 상황이었는데 할아버지가 수긍하면서 어차피 살아봤자 얼마나 더 살겠냐는 마음으로(갑자기 내가 독심술을 할 수 있옸음) 사진이나 찍어달라는 거임 마지막.. 죽기 전 사진? 그런거 그래서 내 폰으로 몇 장 찍는데 자꾸 뭐가 카메라를 가려서 사진이 예쁘게 안 나와서 빡치는 와중에 할아버지는 강아지 모양 풍선아트 들고 해맑게 웃고 있어서 너무 눈물났음 그 뒤엔 엄마랑도 사진 찍었는데 그땐 진짜 카메라가 반 정도가 가려지는 상황이었음 근데 그러다가 잠깸  너무 현실이라고 느꼈던 이유는 그 꿈 안에서 또 꿈 얘기를 하는데 내친구들이랑 지인들이 다 전쟁나는 꿈을 꿨다는 공통점이 있었고 실제로 전쟁 일어나기 직전이어서 아 다같이 꿈을 꾼 게 꿈이 아니었구나 뭐 이런 생각도 혼자 하고 근데 결국엔 대피하는 와중에는 미사일이나 이런 건 안 떨어짐 꿈 초반에 한 번 떨어졌었는데 바다에서 물에 약간 엎드려있으면 폭탄의 열이나 그런 거 피할 수 있다길래 그러고 있었름', color: '#85a540' },
            { title: '내 메모장에 있는 꿈 얘기들이 세상밖으로 나오는 날이 오다니', author: '재윤', description: '그 ㅈㄴ 플랜테리어같은 공간에서 테런 달려라영어왕처럼 뭐 퀴즈 풀고 그러는 꿈 있었는데 기억이 안 남 이상한 나라의 앨리스?같은 느낌이었음 꿈이. 근데 이 꿈을 이 때 이후로 계속 반복적으로 꿈 요즘에는 안 꾸는 거 같은데', color: '#B2AAA3' },
            { title: '여우괴물', author: '어디', description: '어린이집 귀가시간에 선생님이 갑자기 여우괴물이되는 꿈', color: '#F94C10' },
            { title: '감독인가', author: 'me', description: '수지가 엄청 상징적인 드레스를 입고 좋은 톤으로 상대(여자)의 머리를 날리며(폭탄같은걸로) 말하는 영화', color: '#6E44FF' },
            { title: '자살을선언한기계인간', author: '안드로이드', description: '내가 안드로이드? 였나 암튼 사람이 아니어서 뭐 감정을 못느끼고 그랬는데 그걸 속이고 나를 키움 그리고 드디어 꿈 속에서 오늘 그걸 밝히려고 하는데 나 빼고 소문이 쫙 난거 이걸(나의 이런 인생을) 영화로 만들어서 상영할라했음 그래서 나는 너무 충격받고 반란? 을 할려고 이제 열심히 하다가 드디어 영화가 개봉하는 첫 개봉일에 그거 터뜨리고 성공함 감사하다고 좀 울었던 것 같음', color: '#FAF7F5' },
            { title: '다마고치와', author: '코딱지', description: '다마고치 오리지널 버전을 키우고 있는데 이게 고장이 남. 다마고치 수리 기사로 김문수가 우리 집을 옴. 뚝딱뚝딱 고치더니 떠날 때 다마고치 썸을 선물로 줌. 정말 갖고싶었데 일본에서도 안팔아서 못샀었다, 줘서 너무너무 감사하다 이런 tmi를 김문수한테 함.  김문수는 떠나고 갑자기 배경이 학교가 됐는데 이 세상이 게임화 됨. 몬스터가 막 소환됨. 마크 벌집 건들인 것 마냥 벌 한 50마리 정도가 날 쫓아옴ㅠ. 주변 친구들이 폭탄(스킬) 던져서 잡으라고 훈수 두는데 벌 이동속도 넘 빠르고 스킬 발동 시간까지 넘 오래 걸림. 그래서 미리 앞쪽에 스킬 써놓고 벌이 그쪽에 가도록 유도해서 잡음.  벌 죽고 전리품으로 가챠가 나옴. 그래서 열심히 깠더니 포켓몬 다마고치가 나와서 오 대박 친구들한테 자랑해야지.... 하다가 잠에서 깸 ', color: '#FFDFBA' },
            { title: '수색', author: '코딱지', description: '할머니 댁 갔는데 윗집 사는 여자아이가 파리바게뜨 알바 대타 부탁함. 일단 ㅇㅋㅇㅋ 했는데 생각해보니까 할머니 댁이면 우리 동네가 아니잖음. 근데 이미 그 사람은 바나나 옷을 입고 봉사활동을 하러 떠남.. 그래서 동네 한 바퀴를 뛰어서 그 사람을 찾는데 없음. 포기하고 다시 할머니댁 가는데 바나나 옷 입은 무리가 플로깅을 하고 있는거. 되게 신기하다 생각하다가 정신차리고 얼른 그 사람 찾아서 저기요 저 여기 파바에서 일 안해요 ㅠㅠ 말하고 깸.', color: '#CCC7C2' },

        ];
        
        // 60개까지 파티클 생성
        for (let i = 0; i < 45; i++) {
            const template = defaultParticles[i % defaultParticles.length];
            const particle = this.createParticle({
                ...template,
                title: i < defaultParticles.length ? template.title : `${template.title} ${Math.floor(i / defaultParticles.length) + 1}`,
                // 화면 전체에 랜덤하게 배치
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height
            });
            this.particles.push(particle);
        }
        this.updateDreamCounter();
        // localStorage에 백업 저장
        this.saveParticlesToStorage();
        console.log(`${this.particles.length}개 기본 파티클 생성됨`);
    }
    
    async addNewParticle() {
        const title = document.getElementById('particleTitle').value.trim();
        const author = document.getElementById('particleAuthor').value.trim();
        const description = document.getElementById('particleDescription').value.trim();
        const color = document.getElementById('particleColor').value;
        
        
        if (!title) {
            alert('제목을 입력해주세요.');
            return;
        }
        
        // 현재 파티클 상태에 따라 새 파티클의 위치와 상태 설정
        let particleData = {
            title: title,
            author: author || '익명',
            description: description || '설명이 없습니다.',
            color: color,
            isGathered: this.isGathered
        };

        // 데이터베이스에 저장
        const savedData = await this.saveParticleToDatabase(particleData);
        
        // 새 파티클 생성 위치 결정
        let newX, newY, newTargetX, newTargetY;
        
        if (this.isGathered) {
            // 모여있는 상태일 때는 중앙 근처에 배치
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            particleData.x = centerX + (Math.random() - 0.5) * 100;
            particleData.y = centerY + (Math.random() - 0.5) * 100;
            particleData.targetX = particleData.x;
            particleData.targetY = particleData.y;
        } else {
            // 움직이는 상태일 때는 랜덤 위치에 배치
            particleData.x = Math.random() * this.canvas.width;
            particleData.y = Math.random() * this.canvas.height;
        }
        
        const newParticle = this.createParticle(particleData);
        this.particles.push(newParticle);
        this.saveParticlesToStorage();
        
        // 폼 초기화
        document.getElementById('particleTitle').value = '';
        document.getElementById('particleAuthor').value = '';
        document.getElementById('particleDescription').value = '';
        document.getElementById('particleColor').value = '#605E58';
        
        // 모달 닫기
        document.getElementById('addModal').style.display = 'none';

        // 성공 메시지
        if (savedData) {
            console.log('파티클이 데이터베이스에 저장되었습니다!');
            alert('파티클이 성공적으로 추가되었습니다!');
        } else {
            console.log('파티클이 로컬에 저장되었습니다.');
            alert('파티클이 로컬에 저장되었습니다.');
        }
        
        // 상태 로그
        console.log(`새 파티클 생성됨 - 모임 상태: ${this.isGathered ? '모임' : '흩어짐'}`);

    }
    
    handleWheel(event) {
        if (event.deltaY > 0) {
            // 휠 다운 - 파티클들이 모임
            this.gatherParticles();
        } else {
            // 휠 업 - 흩어지기 (자연스럽게 움직임 재개)
            this.scatterParticles();
        }
    }
    
    gatherParticles() {
        this.isGathered = true;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        this.particles.forEach(particle => {
            particle.targetX = centerX + (Math.random() - 0.5) * 100;
            particle.targetY = centerY + (Math.random() - 0.5) * 100;
            particle.isGathered = true;
        });
    }
    
    scatterParticles() {
        this.isGathered = false;
        this.particles.forEach(particle => {
            // 흩어질 때는 단순히 isGathered만 false로 설정
            // 파티클들이 현재 위치에서 바로 자연스럽게 움직이기 시작
            particle.isGathered = false;
        });
    }
    
    handleCanvasClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;
        
        // 클릭된 파티클 찾기
        const clickedParticle = this.particles.find(particle => {
            const distance = Math.sqrt(
                Math.pow(clickX - particle.x, 2) + 
                Math.pow(clickY - particle.y, 2)
            );
            return distance <= particle.radius;
        });
        
        if (clickedParticle) {
            this.showParticleInfo(clickedParticle);
        }
    }
    
    showParticleInfo(particle) {
        document.getElementById('particleModalTitle').textContent = particle.title;
        document.getElementById('particleModalAuthor').textContent = particle.author;
        document.getElementById('particleModalDescription').textContent = particle.description;
        document.getElementById('particleColorDisplay').style.backgroundColor = particle.color;
        document.getElementById('particleModal').style.display = 'block';
    }
    
    // 마우스와 파티클 간의 충돌 감지
    checkMouseCollision() {
        this.particles.forEach(particle => {
            const distance = Math.sqrt(
                Math.pow(this.mouseX - particle.x, 2) + 
                Math.pow(this.mouseY - particle.y, 2)
            );
            
            // 마우스가 파티클 반경 내에 있으면 hover 상태로 설정
            particle.isHovered = distance <= particle.radius + 5; // 약간의 여유 공간 추가
        });
    }
    
    updateParticle(particle) {
        if (particle.isGathered) {
            // 목표 지점으로 이동 (모였을 때)
            const dx = particle.targetX - particle.x;
            const dy = particle.targetY - particle.y;
            particle.x += dx * 0.05;
            particle.y += dy * 0.05;
        } else {
            // 일반 이동 (왼쪽에서 오른쪽으로) - 바로 움직임 시작
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // 화면 경계 처리
            if (particle.x > this.canvas.width + particle.radius) {
                // 오른쪽 경계를 넘어가면 왼쪽에서 다시 시작
                // Y 위치는 그대로 유지하여 자연스러운 흐름 생성
                particle.x = -particle.radius;
                // particle.y는 변경하지 않음 - 같은 높이에서 계속 이동
            }
            
            // 상하 경계 처리 (부드럽게 반사)
            if (particle.y <= 0 || particle.y >= this.canvas.height) {
                particle.vy *= -1;
                particle.y = Math.max(0, Math.min(this.canvas.height, particle.y));
            }
        }
    }
    
    drawParticle(particle) {
        // 기본 그라데이션 생성
        const gradient = this.ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, particle.radius
        );
        gradient.addColorStop(0, particle.color);
        gradient.addColorStop(1, particle.color + '00'); // 투명하게
        
        // 호버 상태일 때 glow 효과 추가
        if (particle.isHovered) {
            // 외부 glow 효과
            const glowGradient = this.ctx.createRadialGradient(
                particle.x, particle.y, particle.radius,
                particle.x, particle.y, particle.radius + 5
            );
            glowGradient.addColorStop(0, particle.color + '80'); // 50% 투명도
            glowGradient.addColorStop(0.5, particle.color + '40'); // 25% 투명도
            glowGradient.addColorStop(1, particle.color + '00'); // 완전 투명
            
            // glow 효과 그리기
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius + 15, 0, Math.PI * 2);
            this.ctx.fillStyle = glowGradient;
            this.ctx.fill();
            
            // 테두리 glow 효과
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius + 3, 0, Math.PI * 0);
            this.ctx.strokeStyle = particle.color + 'AA'; // 약간 투명한 테두리
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }
        
        // 기본 파티클 그리기
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
    }
    
    animate() {
        // 캔버스를 투명하게 클리어 (배경 이미지가 보이도록)
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 마우스와 파티클 간의 충돌 감지
        this.checkMouseCollision();
        
        // 파티클들이 모여있을 때 연결선 그리기
        if (this.isGathered) {
            this.drawConnections();
        }
        
        // 파티클 업데이트 및 그리기
        this.particles.forEach(particle => {
            this.updateParticle(particle);
            this.drawParticle(particle);
        });
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    drawConnections() {
        const maxDistance = 80; // 연결선을 그릴 최대 거리
        
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const particle1 = this.particles[i];
                const particle2 = this.particles[j];
                
                const distance = Math.sqrt(
                    Math.pow(particle1.x - particle2.x, 2) + 
                    Math.pow(particle1.y - particle2.y, 2)
                );
                
                if (distance < maxDistance) {
                    const opacity = 1 - (distance / maxDistance);
                    this.ctx.beginPath();
                    this.ctx.moveTo(particle1.x, particle1.y);
                    this.ctx.lineTo(particle2.x, particle2.y);
                    this.ctx.strokeStyle = `rgba(200, 200, 200, ${opacity * 0.3})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }
            }
        }
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}

// 페이지 로드 시 파티클 시스템 초기화
document.addEventListener('DOMContentLoaded', () => {
    const particleSystem = new ParticleSystem();
});
