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
            { title: '바다', author: '이태경', description: '금색 밀밭에 있는 오두막에서 나오는 나', color: '#FFDFBA' },
        ];
        
        // 60개까지 파티클 생성
        for (let i = 0; i < 5; i++) {
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
        document.getElementById('particleColor').value = '#3b82f6';
        
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