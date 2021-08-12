class BasicVertexEvent extends VertexEvent {
    
    //  This is just a subclass to carry the Obstacle object in addition to the Polyline.
    private /* internal */ get Obstacle(): Obstacle {
    }
    private /* internal */ set Obstacle(value: Obstacle)  {
    }
    
    private /* internal */ constructor (obstacle: Obstacle, p: PolylinePoint) : 
            base(p) {
        this.Obstacle = obstacle;
    }
}