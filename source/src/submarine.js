// ============================================================================
// submarine mesh - procedural futuristic research submersible
// ============================================================================
function meshSubmarine() {
  const m = new Mesh();
  const Lh = 2.35, Rh = 0.85; // half-length, radius

  // main hull: lathe profile - streamlined teardrop
  const prof = [
    [0, -Lh, 0.08],
    [0.55, -Lh*0.78, 0.12],
    [0.95, -Lh*0.35, 0.20],
    [1.0, -0.1, 0.22],
    [0.98, 0.25*Lh, 0.20],
    [0.82, 0.55*Lh, 0.16],
    [0.50, 0.85*Lh, 0.10],
    [0.18, Lh*0.97, 0.04],
    [0, Lh, 0.02],
  ];
  // scale radii by hull radius
  const seg = 24;
  const rings = [];
  for (const [r0, y0, ao] of prof) {
    const ring = [];
    for (let s = 0; s < seg; s++) {
      const a = s / seg * TAU;
      const r = r0 * Rh;
      ring.push(m.v(cos(a)*r, y0, sin(a)*r, ao));
    }
    rings.push(ring);
  }
  for (let k = 0; k < rings.length - 1; k++) for(let s=0;s<seg;s++){
    const s2=(s+1)%seg;
    // flip winding so normal points outward
    m.quad(rings[k][s], rings[k+1][s], rings[k+1][s2], rings[k][s2]);
  }
  // add canopy: transparent dome on top front (extract a patch and make frame + glass)
  // We'll build canopy as separate lathe section: half-ellipsoid on top
  const canopyZ = 0.18, canopyY = 0.05, canopyLen = 1.1, canopyW = 0.55;
  // canopy frame ring
  const cRings = [];
  const cSeg = 18;
  const cProf = [
    [0.02, -canopyLen/2, canopyW*0.2],
    [0.38, -canopyLen*0.15, canopyW*0.8],
    [0.45,  canopyLen*0.18, canopyW*0.95],
    [0.32,  canopyLen*0.42, canopyW*0.55],
    [0.08,  canopyLen/2, canopyW*0.15],
  ];
  for (const [r, y, ao] of cProf) {
    const ring=[];
    for(let s=0;s<cSeg;s++){
      const a = s/cSeg*TAU;
      // only top half for dome - flatten bottom
      let rr=r;
      let yy=y, xx=cos(a)*rr, zz=sin(a)*rr;
      // make canopy sit on hull: offset y up
      yy += canopyY;
      // scale x to be elliptical
      xx *= 0.9;
      ring.push(m.v(xx, yy, zz, 1.0+ ao*0.02));
    }
    cRings.push(ring);
  }
  // We will later mark canopy material via vertex aux? For now build as hull but we need material override.
  // Instead, we create canopy geometry with different aux tag (we use aux as material hint via custom vertex attribute)
  // Simpler: build canopy but we'll render with same shader but give it different shading via position heuristic.
  // To differentiate material, we store canopy vertices separately and later rewrite their w aux to flag.
  const canopyStart = m.p.length/3;
  for (let k=0;k<cRings.length-1;k++) for(let s=0;s<cSeg;s++){
    const s2=(s+1)%cSeg; m.quad(cRings[k][s], cRings[k+1][s], cRings[k+1][s2], cRings[k][s2]);
  }

  // side thrusters: two cylindrical pods on sides
  for(const side of [-1,1]){
    const cx = side*1.05, cy=-0.15, cz=-0.2;
    const pts=[];
    for(let k=0;k<=6;k++) pts.push([cx, cy, cz + (k/6-0.5)*1.1]);
    const rStart = m.p.length/3;
    m.tube(pts, 0.18, 10, true);
    // nozzles
    const noz = [[cx, cy, cz+0.55],[cx, cy, cz+0.78]];
    m.tube(noz, (k)=>k==0?0.16:0.12, 10, false);
    // thruster pods remain hull material (0)
  }

  // vertical thrusters: dorsal + ventral small cylinders
  for(const vSide of [-1,1]){
    const vcx=0, vcy=vSide*0.88, vcz=-0.15;
    const pts=[[vcx, vcy, vcz-0.3],[vcx, vcy, vcz+0.3]];
    m.tube(pts, 0.14, 8, true);
  }

  // rear fins: top fin + two side stabilizers
  const fin = (base, tip, w) => {
    const a=m.v(base[0],base[1],base[2],0.15), b=m.v(base[0]+w,base[1],base[2],0.15), c=m.v(tip[0],tip[1],tip[2],0.15), d=m.v(tip[0]+w*0.6,tip[1],tip[2],0.15);
    m.quad(a,b,d,c); m.quad(c,d,b,a);
  };
  fin([0, 0.62,-Lh*0.55],[0,1.25,-Lh*0.65], 0.06);
  fin([-0.18,0.05,-Lh*0.6],[ -0.95,0.12,-Lh*0.75],0.06);
  fin([0.18,0.05,-Lh*0.6],[0.95,0.12,-Lh*0.75],0.06);

  // main propeller: 4 blades at rear
  // hub
  const hubPts = [[0, -Lh-0.08,0],[0,-Lh-0.22,0]];
  const hubStart = m.p.length/3;
  m.tube(hubPts, 0.12, 10, true);
  // blades - we will generate as separate mesh for animation, but include static for shadow
  // store propeller blade vertices for animated instance
  // We'll build propeller mesh separately for animated rendering

  return { mesh: m, canopyStart, hubStart };
}

function meshPropeller() {
  const m = new Mesh();
  const blades = 4;
  for(let b=0;b<blades;b++){
    const ang = b/blades*TAU;
    const ca=cos(ang), sa=sin(ang);
    // blade quad: from hub outward
    const r0=0.08, r1=0.58;
    const chord=0.18;
    // blade slightly twisted
    const p0 = [ca*r0, sa*r0, 0];
    const p1 = [ca*r1 - sa*chord*0.5, sa*r1 + ca*chord*0.5, 0.06];
    const p2 = [ca*r1 + sa*chord*0.5, sa*r1 - ca*chord*0.5, -0.04];
    const p3 = [ca*r0, sa*r0, 0];
    const a=m.v(p0[0],p0[1],p0[2],0.12), b=m.v(p1[0],p1[1],p1[2],0.12), c=m.v(p2[0],p2[1],p2[2],0.12), d=m.v(p3[0],p3[1],p3[2],0.12);
    m.quad(a,b,c,d);
    m.quad(d,c,b,a);
  }
  // hub cap
  const hub=[];
  for(let s=0;s<8;s++){ const a=s/8*TAU; hub.push(m.v(cos(a)*0.13, sin(a)*0.13, 0, 0.1));}
  const cen=m.v(0,0,0.02,0.1);
  const cen2=m.v(0,0,-0.02,0.1);
  for(let s=0;s<8;s++) { m.tri(hub[s], hub[(s+1)%8], cen); m.tri(hub[(s+1)%8], hub[s], cen2);}
  return m;
}

function meshHeadlights() {
  const m=new Mesh();
  // two headlight housings
  for(const side of [-1,1]){
    const x=side*0.38, y=0.05, z=1.05;
    // housing cylinder
    const pts=[[x,y,z-0.12],[x,y,z+0.08]];
    m.tube(pts, 0.16, 12, true);
    // lens sphere cap
    const cap = icosphere(1, (nx,ny,nz)=>[x+nx*0.14, y+ny*0.14, z+0.08+nz*0.07]);
    // merge cap vertices into m
    for(let i=0;i<cap.p.length;i+=3) m.v(cap.p[i],cap.p[i+1],cap.p[i+2], 2.2);
    for(let i=0;i<cap.i.length;i+=3) m.tri(m.p.length/3 - cap.p.length/3 + cap.i[i], m.p.length/3 - cap.p.length/3 + cap.i[i+1], m.p.length/3 - cap.p.length/3 + cap.i[i+2]);
  }
  return m;
}
