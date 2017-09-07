(function () {
    'use strict';

    describe('DocumentService', function(){
        var documentService = new DocumentService();
        var testDoc1 = '/test/doc1';
        describe('CRUD operations', function(){
            it('should create', function(){
            });
            it('should read', function(){
            });
            it('should update', function(){
            });
            it('should delete', function(){
            });
        });
        describe('search operations', function(){
            it('should find', function(){

            });
            it('should search', function(){

            });
        });
    });
    describe('StringScanner', function(){
        var testString = 'abc';
        var scanner;
        it('should only accept strings', function(){
            expect(function(){new StringScanner()}).to.throw('Illegal argument');
            expect(function(){new StringScanner(1)}).to.throw('Illegal argument');
            expect(function(){new StringScanner({})}).to.throw('Illegal argument');
            expect(function(){scanner = new StringScanner(testString)}).to.not.throw('Illegal argument');
        });
        describe('addToken', function(){
            it('should be allowed to be added only once', function(){
                var test = function(){
                    scanner.addToken('A', 'a');
                };
                expect(test).to.not.throw();
                expect(test).to.throw('Token already added.');
            });
        });
        describe('hasNext', function(){
            it('should detect if any token matches', function(){
                assert(scanner.hasNext());
            });
            it('should detect if a specific token matches', function(){
                assert(scanner.hasNextPat('A'));
            });
            it('should detect if a given token matches', function(){
            });
        });
        describe('peek', function(){
            it('should return the next token without advancing', function(){
                assert(scanner.peek());
                assert(scanner.peek()===scanner.peek());
            });
            it('curToken should be read-only', function(){
                expect(function(){scanner.curToken='value'}).to.throw('setting a property that has only a getter');
            });
        });
        describe('next', function(){
            it('should consume and return the next token', function(){
                var next = scanner.next();
                assert(next!==undefined);
            });
        });
    });
})();
